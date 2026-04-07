from django.db import models
from django.contrib.auth.models import User
from encrypted_model_fields.fields import EncryptedCharField
from django.utils import timezone

# Create your models here.

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    dni = models.CharField(max_length=20, unique=True, null=True, blank=True)
    encrypted_info = EncryptedCharField(max_length=100)  # Example encrypted field


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_otps')
    otp_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f'OTP for {self.user.username} ({"used" if self.is_used else "active"})'


class LoginAttempt(models.Model):
    identifier = models.CharField(max_length=20, unique=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_locked(self):
        return self.locked_until is not None and timezone.now() < self.locked_until

    def __str__(self):
        return f'LoginAttempt for {self.identifier}'
