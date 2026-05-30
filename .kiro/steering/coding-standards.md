---
inclusion: auto
---

# Estándares de Código

## Estilo

- JavaScript ES2020+ (top-level await no usado, pero `fetch` nativo de Node 18 sí)
- Sin TypeScript — proyecto vanilla JS
- Funciones `async/await` para llamadas a API
- Express 4.x patterns (middleware, router)

## Convenciones del proyecto

- Token de autenticación se pasa via header `x-token` (no Authorization directo al cliente)
- El servidor actúa como proxy hacia `https://api.simpliroute.com/v1`
- Datos demo hardcodeados en `server.js` (VEHICLES, DRIVERS, VISITS)
- Fechas se calculan como "mañana" (`tomorrow()`)

## Manejo de errores

- Try/catch en cada endpoint
- Respuestas de error: `{ error: "mensaje" }`
- Status codes: 400 (bad request), 401 (auth), 500 (server error)

## Archivos estáticos

- Todo en `public/` se sirve estáticamente
- Fallback `*` redirige a `index.html` (SPA routing)
