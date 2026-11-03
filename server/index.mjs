import { createServer } from 'node:http';
import express from 'express';
import { resolve } from 'node:path';
import { createApp } from './app.mjs';

const port = Number(process.env.PORT || 3000);
const { app } = createApp({ exposeTokens: process.env.NODE_ENV !== 'production' });

if (process.env.NODE_ENV === 'production') {
  const dist = resolve('dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(resolve(dist, 'index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

createServer(app).listen(port, '0.0.0.0', () => console.log(`Krunest ready at http://localhost:${port}`));
