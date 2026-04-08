# ISPC-ProgIII-Front

Frontend del proyecto de Programacion III (ISPC), construido con Angular.

## Estructura

- login-frontend/: aplicacion principal.

## Funcionalidades implementadas

- Login con DNI + contrasena.
- Registro con validaciones.
- Integracion con reCAPTCHA v2 en login y registro.
- Pantalla Home con:
  - carrusel automatico,
  - tarjetas de contenido,
  - boton flotante de WhatsApp.
- Integracion con backend Django por API REST.

## Ejecutar frontend

```powershell
cd login-frontend
npm install
npm start
```

Aplicacion en: http://localhost:4200

## Configuracion

Archivo de entorno:

- login-frontend/src/environments/environment.ts

Variables relevantes:

- apiBaseUrl
- recaptchaSiteKey

## Scripts utiles

```powershell
npm start      # desarrollo
npm run build  # build produccion
npm test       # tests
```

## Nota

Proyecto con objetivo educativo para practicas de Programacion III.
