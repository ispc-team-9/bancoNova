# ISPC-ProgIII-Front

Repositorio de consulta para la cátedra Programación III del ISPC.

## Proyecto: Login Frontend

Este repositorio contiene un proyecto de login desarrollado en Angular, pensado para prácticas de estudiantes de Programación III del ISPC.

### ¿Qué incluye?
- Formulario de login con validación de usuario y contraseña.
- Redirección a una pantalla de bienvenida tras el login exitoso.
- Estructura simple y clara para fines educativos.

## ¿Cómo ejecutar el proyecto?

1. Ingresa a la carpeta del frontend:
	```
	cd login-frontend
	```
2. Instala las dependencias:
	```
	npm install
	```
3. Inicia el servidor de desarrollo:
	```
	npm start
	```
4. Abre tu navegador en [http://localhost:4200/](http://localhost:4200/)

El sistema recargará automáticamente ante cualquier cambio en el código fuente.

## Sobre el login
- El formulario solicita usuario y contraseña.
- Al enviar datos válidos, realiza una petición a un backend (por defecto: `http://localhost:8000/api/login/`).
- Si el login es exitoso, redirige a la pantalla de bienvenida.

## Requisitos
- Node.js y npm instalados.
- Angular CLI instalado globalmente (opcional, recomendado):
  ```
  npm install -g @angular/cli
  ```

## Recursos útiles
- [Documentación Angular CLI](https://angular.dev/tools/cli)
- [Documentación oficial Angular](https://angular.dev/)

---

Este proyecto es solo para fines educativos y de práctica.
