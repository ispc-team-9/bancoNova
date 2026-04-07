from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile

class UserSerializer(serializers.ModelSerializer):
    dni = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'dni']

    def get_dni(self, obj):
        profile = getattr(obj, 'userprofile', None)
        return getattr(profile, 'dni', None)

class RegisterSerializer(serializers.ModelSerializer):
    dni = serializers.CharField(max_length=20, write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'dni', 'password']

    def validate_dni(self, value):
        dni = value.strip()
        if not dni:
            raise serializers.ValidationError('El DNI es obligatorio.')

        if UserProfile.objects.filter(dni=dni).exists():
            raise serializers.ValidationError('El DNI ya esta registrado.')

        return dni

    def create(self, validated_data):
        dni = validated_data.pop('dni')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        UserProfile.objects.create(user=user, dni=dni, encrypted_info='')
        return user

    def to_representation(self, instance):
        return UserSerializer(instance).data

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = UserProfile
        fields = ['user', 'encrypted_info']


class PasswordRecoveryRequestSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=150)


class LoginSerializer(serializers.Serializer):
    dni = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)

    def validate_dni(self, value):
        return value.strip()


class PasswordRecoveryResetSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=150)
    otp_code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Las contrasenas no coinciden.'})

        validate_password(attrs['new_password'])
        return attrs