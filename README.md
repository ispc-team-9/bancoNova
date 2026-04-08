# ISPC - Proyecto Full Stack (Programacion III)

<picture><img src="/login.png" alt="Captura de login" style="height: 250px;"></picture>

Workspace con frontend en Angular y backend en Django REST Framework para autenticacion y seguridad.

## Modulos del workspace

```text
ispc/
  ISPC-ProgIII-Front-main/
    login-frontend/      # Angular 21
  ISPC-ProgIII-main/     # Django + DRF + JWT
```

## Funcionalidades actuales

- Registro de usuarios con DNI.
- Login con JWT (access y refresh).
- Bloqueo temporal tras intentos fallidos.
- Recuperacion de contrasena con OTP.
- Validacion reCAPTCHA v2 en login y registro.
- Home con carrusel automatico y seccion de tarjetas.
- Boton flotante de WhatsApp en Home.

## Requisitos

- Node.js 18 o superior
- npm 10 o superior
- Python 3.10 o superior
- PostgreSQL

## Puesta en marcha (local)

Se recomienda usar dos terminales.

### 1) Backend

```powershell
cd ISPC-ProgIII-main
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Crear DB si no existe:

```powershell
psql -U postgres -c "CREATE DATABASE ispc_db;"
```

Migraciones y servidor:

```powershell
python manage.py migrate
python manage.py runserver
```

Backend: http://localhost:8000

### 2) Frontend

```powershell
cd ISPC-ProgIII-Front-main/login-frontend
npm install
npm start
```

Frontend: http://localhost:4200

## Configuracion de entorno

### Frontend

Archivo:

- ISPC-ProgIII-Front-main/login-frontend/src/environments/environment.ts

Variables clave:

- apiBaseUrl
- recaptchaSiteKey

### Backend

Archivo:

- ISPC-ProgIII-main/backend/settings.py

Variables clave:

- DATABASES
- RECAPTCHA_SECRET_KEY

## Endpoints principales

- POST /api/register/
- POST /api/login/
- POST /api/password-recovery/request-otp/
- POST /api/password-recovery/reset/

## Nota

Proyecto educativo de Programacion III (ISPC).