from django.urls import path
from .views import (
    LoginView,
    PasswordRecoveryRequestOTPView,
    PasswordRecoveryResetView,
    RegisterView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('password-recovery/request-otp/', PasswordRecoveryRequestOTPView.as_view(), name='password_recovery_request_otp'),
    path('password-recovery/reset/', PasswordRecoveryResetView.as_view(), name='password_recovery_reset'),
]