# SimpliRoute Enterprise Demo
**Torre de Control de Última Milla con IA Agéntica**

Developed by **José Luis Arellano** — Forward Deployed Engineer

## Deploy en Railway (2 minutos)
1. Sube este proyecto a un repo de GitHub
2. Ve a [railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Selecciona el repo → Deploy

## Deploy en Vercel
1. Instala Vercel CLI: `npm i -g vercel`
2. En la raíz del proyecto ejecuta:
```bash
vercel
```
3. Sigue las instrucciones (selecciona tu cuenta, confirma el directorio)
4. Para producción:
```bash
vercel --prod
```

> **Nota:** Como el proyecto usa un servidor Express, necesitas configurar `vercel.json` en la raíz:

```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server.js" },
    { "src": "/(.*)", "dest": "public/$1" }
  ]
}
```

Alternativamente, puedes hacer deploy desde el dashboard:
1. Ve a [vercel.com](https://vercel.com)
2. Import Project → selecciona tu repo de GitHub
3. Framework Preset: **Other**
4. Deploy

El proyecto estará disponible en `https://tu-proyecto.vercel.app`

## Deploy local
```bash
npm install
node server.js
# Abre http://localhost:3000
```

## Qué hace
- Conecta a SimpliRoute API con tu token
- Crea/borra flota, conductores y entregas vía API
- Simula incidencias logísticas con resolución por IA agéntica
- Muestra flujos de integración API en tiempo real
- Presenta propuesta económica al final

## Stack
Express.js · Vanilla JS · SimpliRoute REST API · AI Orchestration
