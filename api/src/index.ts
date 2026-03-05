import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import eventRoutes from './routes/event.js';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Enable CORS
await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
});

import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await fastify.register(websocket);

// Serve static assets from the workspace assets folder
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../../assets'),
  prefix: '/assets/', // optional: default '/'
});

const prisma = new PrismaClient();

fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Register routes
fastify.register(eventRoutes);

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4000');
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
