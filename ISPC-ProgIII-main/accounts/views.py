import random
from datetime import timedelta

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.utils import timezone
from .models import PasswordResetOTP
from .serializers import (
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

class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
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
