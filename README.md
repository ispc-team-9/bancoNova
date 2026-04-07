# Captura de pantalla
<picture><img src="/login.png" alt="logo" style="height: 250px;"></picture>

# Login y Seguridad - Proyecto Full Stack (ISPC)
Este workspace contiene un proyecto completo de autenticación con:

- Frontend en Angular
- Backend en Django REST Framework con JWT
- Recuperación de contraseña con OTP

## Estructura del proyecto

```text
ispc/
	ISPC-ProgIII-Front-main/
		login-frontend/        # Frontend Angular
	ISPC-ProgIII-main/       # Backend Django
```

## Donde esta cada parte

- Frontend: `ISPC-ProgIII-Front-main/login-frontend`
- Backend: `ISPC-ProgIII-main`

## Requisitos

- Node.js 18+
- npm
- Python 3.10+
- PostgreSQL

## Como iniciar el proyecto

Se recomienda usar 2 terminales: una para backend y otra para frontend.

### 1) Levantar el backend (Django)

```powershell
cd ISPC-ProgIII-main
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Crear base de datos en PostgreSQL (si no existe):

```powershell
psql -U postgres -c "CREATE DATABASE ispc_db;"
```

Aplicar migraciones y correr servidor:

```powershell
python manage.py migrate
python manage.py runserver
```

Backend disponible en: `http://localhost:8000`

### 2) Levantar el frontend (Angular)

En otra terminal:

```powershell
cd ISPC-ProgIII-Front-main/login-frontend
npm install
npm start
```

Frontend disponible en: `http://localhost:4200`

## Conexion frontend-backend

El frontend ya esta configurado para consumir la API en:

`http://localhost:8000/api`

Archivo de entorno:

- `ISPC-ProgIII-Front-main/login-frontend/src/environments/environment.ts`

## Endpoints principales

- `POST /api/register/`
- `POST /api/login/`
- `POST /api/password-recovery/request-otp/`
- `POST /api/password-recovery/reset/`

## Nota rapida de configuracion

La configuracion de base de datos del backend esta en:

- `ISPC-ProgIII-main/backend/settings.py`

Si usas otro usuario/password/puerto de PostgreSQL, ajustalo en ese archivo.

---

Proyecto educativo - Programacion III - ISPC