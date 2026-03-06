import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { generateImageWithHuggingFace } from '../services/huggingface.service.js';
import { getPromptSimilarity } from '../services/gemini.service.js';

const prisma = new PrismaClient();

// WebSocket clients
const clients = new Set<any>();

function broadcast(message: any) {
    const data = JSON.stringify(message);
    for (const client of clients) {
        try {
            if (client.socket && client.socket.readyState === 1) { // 1 = OPEN
                client.socket.send(data);
            }
        } catch (err) {
            console.error('Broadcast error:', err);
            clients.delete(client);
        }
    }
}

export default async function eventRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // WebSocket handler
    fastify.get('/ws', { websocket: true }, (connection, req) => {
        clients.add(connection);
        connection.socket.on('close', () => {
            clients.delete(connection);
        });
    });

    // POST /events
    fastify.post('/events', async (request, reply) => {
        const { name, maxPlayers } = request.body as { name: string; maxPlayers: number };

        if (!name || !maxPlayers) {
            return reply.status(400).send({ error: 'Name and maxPlayers are required' });
        }

        const event = await prisma.event.create({
            data: {
                name,
                maxPlayers: Number(maxPlayers),
                status: 'waiting'
            }
        });

        return event;
    });

    // GET /events/:id
    fastify.get('/events/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                players: {
                    orderBy: { score: 'desc' },
                    take: 10
                }
            }
        });

        if (!event) {
            return reply.status(404).send({ error: 'Event not found' });
        }

        return event;
    });

    // POST /events/:id/join
    fastify.post<{ Params: { id: string }; Body: { name: string; email: string; phone?: string } }>(
        '/events/:id/join',
        async (request, reply) => {
            const { id } = request.params;
            const { name, email, phone } = request.body;

            if (!name || !email) {
                return reply.status(400).send({ error: 'Name and email are required' });
            }

            const event = await prisma.event.findUnique({
                where: { id },
                include: { _count: { select: { players: true } } }
            });

            if (!event) return reply.status(404).send({ error: 'Event not found' });
            if (event._count.players >= event.maxPlayers) return reply.status(400).send({ error: 'Full' });

            // Create player
            const player = await prisma.player.create({
                data: { name, email, phone: phone || null, eventId: id }
            });

            // If first player, use static reference image
            if (event.status === 'waiting') {
                const referencePrompt = "A futuristic city at night - Match the static image";

                // Using the static image from the backend assets via Next.js proxy
                const imageUrl = `/assets/static_image.png`;

                await prisma.event.update({
                    where: { id },
                    data: {
                        status: 'active',
                        referenceImageUrl: imageUrl,
                        referencePrompt: referencePrompt
                    } as any
                });

                broadcast({ type: 'EVENT_ACTIVE', eventId: id, imageUrl });
            }

            broadcast({ type: 'PLAYER_JOINED', eventId: id, player: { name: player.name, score: 0 } });

            return { success: true, player };
        }
    );

    // POST /events/:id/submit
    fastify.post<{ Params: { id: string }; Body: { email?: string; prompt: string } }>(
        '/events/:id/submit',
        async (request, reply) => {
            const { id } = request.params;
            const { email, prompt } = request.body;

            const event = await prisma.event.findUnique({
                where: { id }
            });

            if (!event || event.status !== 'active') {
                return reply.status(400).send({ error: 'Game not active' });
            }

            let player;
            if (email) {
                player = await prisma.player.findFirst({
                    where: { eventId: id, email }
                });
            } else {
                // Pick the oldest player who hasn't submitted yet
                player = await prisma.player.findFirst({
                    where: { eventId: id, score: null },
                    orderBy: { createdAt: 'asc' }
                });
            }

            if (!player) return reply.status(404).send({ error: 'No active player found' });
            if (player.score !== null) return reply.status(400).send({ error: 'Already submitted' });

            // Generate user AI image
            const userImageUrl = await generateImageWithHuggingFace(prompt);

            // Compare similarity
            const scoreRaw = await getPromptSimilarity((event as any).referencePrompt || "", prompt);
            const score = Math.round(scoreRaw * 100);

            const updatedPlayer = await prisma.player.update({
                where: { id: player.id },
                data: {
                    prompt,
                    generatedImageUrl: userImageUrl,
                    score
                }
            });

            // Update event wins
            const updateData: any = {};
            if (score >= 80) {
                updateData.humanWins = { increment: 1 };
            } else {
                updateData.aiWins = { increment: 1 };
            }

            await prisma.event.update({
                where: { id },
                data: updateData
            });

            broadcast({ type: 'SCORE_UPDATE', eventId: id, player: { name: player.name, score } });

            return { success: true, score, imageUrl: userImageUrl };
        }
    );
}
