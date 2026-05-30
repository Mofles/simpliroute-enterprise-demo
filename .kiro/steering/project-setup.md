---
inclusion: auto
---

# SimpliRoute Enterprise Demo — Guía de Proyecto

## Entorno

- **OS**: WSL2 Ubuntu
- **Runtime**: Node.js >= 18 (ver `engines` en package.json)
- **Puerto por defecto**: 3000 (configurable con `PORT` env var)

## Levantar el proyecto

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

El servidor queda disponible en `http://localhost:3000`.

## Estructura

| Archivo/Carpeta | Descripción |
|-----------------|-------------|
| `server.js` | Servidor Express — API proxy hacia SimpliRoute |
| `public/` | Archivos estáticos servidos por Express |
| `public/index.html` | SPA frontend |
| `Dockerfile` | Imagen de producción (node:18-alpine) |

## Dependencias

- **express** ^4.21.0 — Framework HTTP
- **cors** ^2.8.5 — Middleware CORS

No hay dependencias de desarrollo configuradas.

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/status` | Estado de la cuenta (vehículos, conductores, visitas, planes) |
| POST | `/api/create` | Crea datos demo (vehículos, conductores, visitas, plan) |
| POST | `/api/delete` | Elimina todos los datos demo |
| POST | `/api/reset` | Delete + Create en secuencia |
| POST | `/api/vehicles` | Crear vehículo individual |
| POST | `/api/visits` | Crear visita individual |

Todos los endpoints requieren header `x-token` con el token de SimpliRoute.

## Docker

```bash
docker build -t simpliroute-demo .
docker run -p 3000:3000 simpliroute-demo
```

## Notas WSL2

- Si necesitas acceder desde Windows al servidor en WSL2, usa `localhost:3000` (WSL2 hace port forwarding automático en versiones recientes).
- Si hay problemas de red, verifica con `ip addr show eth0` la IP de WSL2.
- Para hot-reload durante desarrollo puedes usar `nodemon` (no está instalado, agregar con `npm i -D nodemon` si se necesita).
