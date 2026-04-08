# Django Backend API

Backend de autenticacion para el proyecto ISPC.

## Stack

- Django
- Django REST Framework
- Simple JWT
- PostgreSQL
- django-cors-headers

## Funcionalidades

- Registro de usuario con DNI.
- Login por DNI + contrasena.
- Emision de JWT (access y refresh).
- Bloqueo por intentos fallidos de login.
- Recuperacion de contrasena con OTP.
- Validacion server-side de reCAPTCHA v2.

## Requisitos

- Python 3.10+
- PostgreSQL

## Instalacion

```powershell
cd ISPC-ProgIII-main
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Base de datos

Config por defecto en backend/settings.py:

- NAME: ispc_db
- USER: postgres
- PASSWORD: root
- HOST: 127.0.0.1
- PORT: 5432

Crear DB si no existe:

```powershell
psql -U postgres -c "CREATE DATABASE ispc_db;"
```

## Migraciones y ejecucion

```powershell
python manage.py migrate
python manage.py runserver
```

API local: http://localhost:8000

## Variables de entorno

- RECAPTCHA_SECRET_KEY

Si no se define y DEBUG=True, el proyecto puede usar la clave de prueba de Google para desarrollo.

## Endpoints

### POST /api/register/

Body ejemplo:

```json
{
  "username": "user1",
  "email": "user1@example.com",
  "dni": "30111222",
  "password": "Testpass123",
  "captcha_token": "TOKEN_RECAPTCHA"
}
```

### POST /api/login/

Body ejemplo:

```json
{
  "dni": "30111222",
  "password": "Testpass123",
  "captcha_token": "TOKEN_RECAPTCHA"
}
```

Respuesta exitosa:

```json
{
  "refresh": "...",
  "access": "...",
  "user": {
    "id": 1,
    "username": "user1",
    "email": "user1@example.com",
    "dni": "30111222"
  }
}
```

### POST /api/password-recovery/request-otp/

Solicita OTP por usuario o email.

### POST /api/password-recovery/reset/

Resetea contrasena con OTP valido.

## Auth en rutas protegidas

Header:

```text
Authorization: Bearer <access_token>
```

## Tests

```powershell
python manage.py test
```

## Estructura principal

- manage.py
- backend/: settings y config global
- accounts/: modelos, serializers, vistas y tests
