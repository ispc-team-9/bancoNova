from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import LoginAttempt


class AuthAPITest(APITestCase):
    def test_register_success(self):
        url = reverse('register')
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'dni': '30111222',
            'password': 'Testpass123',
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], data['username'])
        self.assertEqual(response.data['email'], data['email'])
        self.assertEqual(response.data['dni'], data['dni'])

    def test_login_success_returns_tokens(self):
        register_url = reverse('register')
        login_url = reverse('login')

        self.client.post(
            register_url,
            {
                'username': 'testuser',
                'email': 'test@example.com',
                'dni': '33222444',
                'password': 'Testpass123',
            },
            format='json',
        )

        response = self.client.post(
            login_url,
            {'dni': '33222444', 'password': 'Testpass123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_login_invalid_credentials(self):
        login_url = reverse('login')

        response = self.client.post(
            login_url,
            {'dni': 'unknown', 'password': 'wrongpass'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get('error'), 'Invalid credentials')

    def test_login_blocks_after_three_attempts_for_five_minutes(self):
        register_url = reverse('register')
        login_url = reverse('login')

        self.client.post(
            register_url,
            {
                'username': 'lockeduser',
                'email': 'locked@example.com',
                'dni': '44555666',
                'password': 'Testpass123',
            },
            format='json',
        )

        for _ in range(2):
            response = self.client.post(
                login_url,
                {'dni': '44555666', 'password': 'wrongpass'},
                format='json',
            )
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(
            login_url,
            {'dni': '44555666', 'password': 'wrongpass'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(
            response.data.get('error'),
            'usted ocupo sus 3 intentos porfavor espere 5 min para volver a empezar',
        )

        response = self.client.post(
            login_url,
            {'dni': '44555666', 'password': 'Testpass123'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        attempt = LoginAttempt.objects.get(identifier='44555666')
        attempt.locked_until = timezone.now() - timedelta(seconds=1)
        attempt.save(update_fields=['locked_until'])

        response = self.client.post(
            login_url,
            {'dni': '44555666', 'password': 'Testpass123'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
