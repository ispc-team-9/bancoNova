from datetime import timedelta

from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import PasswordResetOTP


class PasswordRecoveryAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='recover_user',
            email='recover@example.com',
            password='InitialPass123',
        )
        self.request_otp_url = reverse('password_recovery_request_otp')
        self.reset_url = reverse('password_recovery_reset')

    def test_request_otp_returns_generic_message(self):
        response = self.client.post(
            self.request_otp_url,
            {'identifier': self.user.username},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertTrue(
            PasswordResetOTP.objects.filter(user=self.user, is_used=False).exists()
        )

    def test_reset_password_with_valid_otp(self):
        otp = PasswordResetOTP.objects.create(
            user=self.user,
            otp_code='123456',
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        response = self.client.post(
            self.reset_url,
            {
                'identifier': self.user.username,
                'otp_code': '123456',
                'new_password': 'NewPass1234',
                'confirm_password': 'NewPass1234',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        otp.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass1234'))
        self.assertTrue(otp.is_used)

    def test_reset_password_with_invalid_otp(self):
        PasswordResetOTP.objects.create(
            user=self.user,
            otp_code='654321',
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        response = self.client.post(
            self.reset_url,
            {
                'identifier': self.user.username,
                'otp_code': '111111',
                'new_password': 'AnotherPass123',
                'confirm_password': 'AnotherPass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
