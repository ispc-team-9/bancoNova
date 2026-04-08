import random
from datetime import timedelta

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.utils import timezone
from .models import LoginAttempt, PasswordResetOTP
from .recaptcha import verify_recaptcha_token
from .serializers import (
    LoginSerializer,
    PasswordRecoveryRequestSerializer,
    PasswordRecoveryResetSerializer,
    RegisterSerializer,
    UserSerializer,
)

# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        token = (request.data.get('captcha_token') or '').strip()
        is_valid_captcha, captcha_error = verify_recaptcha_token(token, request.META.get('REMOTE_ADDR'))
        if not is_valid_captcha:
            return Response({'error': captcha_error}, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

class LoginView(APIView):
    permission_classes = (AllowAny,)
    max_login_attempts = 3
    lock_minutes = 5
    lockout_message = 'usted ocupo sus 3 intentos porfavor espere 5 min para volver a empezar'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = (serializer.validated_data.get('captcha_token') or '').strip()
        is_valid_captcha, captcha_error = verify_recaptcha_token(token, request.META.get('REMOTE_ADDR'))
        if not is_valid_captcha:
            return Response({'error': captcha_error}, status=status.HTTP_400_BAD_REQUEST)

        dni = serializer.validated_data['dni']
        password = serializer.validated_data['password']
        login_attempt, _ = LoginAttempt.objects.get_or_create(identifier=dni)

        if login_attempt.is_locked():
            print(self.lockout_message)
            return Response({'error': self.lockout_message}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        user = User.objects.filter(userprofile__dni=dni).first()
        if user and user.check_password(password):
            login_attempt.delete()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })

        login_attempt.attempts += 1
        update_fields = ['attempts']
        if login_attempt.attempts >= self.max_login_attempts:
            login_attempt.attempts = 0
            login_attempt.locked_until = timezone.now() + timedelta(minutes=self.lock_minutes)
            update_fields.extend(['locked_until'])
            print(self.lockout_message)
            login_attempt.save(update_fields=update_fields)
            return Response({'error': self.lockout_message}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        login_attempt.save(update_fields=update_fields)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class PasswordRecoveryRequestOTPView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = PasswordRecoveryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier'].strip()

        user = User.objects.filter(
            Q(username__iexact=identifier) | Q(email__iexact=identifier)
        ).first()

        if user:
            PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)
            otp = f'{random.randint(0, 999999):06d}'
            expires_at = timezone.now() + timedelta(minutes=10)
            PasswordResetOTP.objects.create(user=user, otp_code=otp, expires_at=expires_at)

            # MVP stage: OTP is printed in server logs until email service is integrated.
            print(f'[OTP-RECOVERY] user={user.username} otp={otp} expires_at={expires_at.isoformat()}')

        return Response(
            {'message': 'Si la cuenta existe, enviamos un OTP de recuperacion.'},
            status=status.HTTP_200_OK,
        )


class PasswordRecoveryResetView(APIView):
    permission_classes = (AllowAny,)
    max_attempts = 5

    def post(self, request):
        serializer = PasswordRecoveryResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        identifier = data['identifier'].strip()

        user = User.objects.filter(
            Q(username__iexact=identifier) | Q(email__iexact=identifier)
        ).first()

        if not user:
            return Response({'error': 'OTP invalido o expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        reset_otp = PasswordResetOTP.objects.filter(user=user, is_used=False).order_by('-created_at').first()

        if not reset_otp or reset_otp.is_expired():
            if reset_otp:
                reset_otp.is_used = True
                reset_otp.save(update_fields=['is_used'])
            return Response({'error': 'OTP invalido o expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        if reset_otp.attempts >= self.max_attempts:
            reset_otp.is_used = True
            reset_otp.save(update_fields=['is_used'])
            return Response({'error': 'Se agotaron los intentos del OTP. Solicita uno nuevo.'}, status=status.HTTP_400_BAD_REQUEST)

        if reset_otp.otp_code != data['otp_code']:
            reset_otp.attempts += 1
            update_fields = ['attempts']
            if reset_otp.attempts >= self.max_attempts:
                reset_otp.is_used = True
                update_fields.append('is_used')
            reset_otp.save(update_fields=update_fields)
            remaining_attempts = max(self.max_attempts - reset_otp.attempts, 0)
            return Response(
                {'error': f'OTP incorrecto. Intentos restantes: {remaining_attempts}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(data['new_password'])
        user.save(update_fields=['password'])

        reset_otp.is_used = True
        reset_otp.save(update_fields=['is_used'])
        PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        return Response({'message': 'Contrasena actualizada correctamente.'}, status=status.HTTP_200_OK)
