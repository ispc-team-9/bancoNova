# Login Frontend (Angular)

Aplicacion frontend del proyecto ISPC con autenticacion y panel Home institucional.

## Stack

- Angular 21
- RxJS
- SweetAlert2
- Angular Reactive Forms

## Funcionalidades

- Login por DNI y contrasena.
- Registro de usuario.
- Recuperacion de contrasena por OTP.
- reCAPTCHA v2 (Google) en login y registro.
- Home con carrusel automatico cada 2 segundos.
- Tarjetas de contenido destacadas en Home.
- Boton flotante de WhatsApp.

## Requisitos

- Node.js 18+
- npm 10+

## Instalacion

```powershell
npm install
```

## Ejecutar en desarrollo

```powershell
npm start
```

URL local: http://localhost:4200

## Build

```powershell
npm run build
```

## Tests

```powershell
npm test
```

## Configuracion de entorno

Archivo:

- src/environments/environment.ts

Variables:

- apiBaseUrl: URL base del backend.
- recaptchaSiteKey: Site Key de Google reCAPTCHA.

Para desarrollo local, el proyecto puede usar la Site Key de pruebas de Google.

## Integracion con backend

La app consume estos endpoints:

- POST /api/register/
- POST /api/login/
- POST /api/password-recovery/request-otp/
- POST /api/password-recovery/reset/

La URL base por defecto es:

- http://localhost:8000/api
