from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthAPITest(APITestCase):
    def test_register_success(self):
        url = reverse('register')
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'Testpass123',
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], data['username'])
        self.assertEqual(response.data['email'], data['email'])

    def test_login_success_returns_tokens(self):
        register_url = reverse('register')
        login_url = reverse('login')

        self.client.post(
            register_url,
            {
                'username': 'testuser',
                'email': 'test@example.com',
                'password': 'Testpass123',
            },
            format='json',
        )

        response = self.client.post(
            login_url,
            {'username': 'testuser', 'password': 'Testpass123'},
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
            {'username': 'unknown', 'password': 'wrongpass'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get('error'), 'Invalid credentials')
