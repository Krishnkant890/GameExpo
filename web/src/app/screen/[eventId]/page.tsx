'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getEvent } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

export default function ScreenPage() {
    const { eventId } = useParams() as { eventId: string };
    const [event, setEvent] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eventData = await getEvent(eventId);
                setEvent(eventData);
                setPlayers(eventData.players || []);
            } catch (err: any) {
                setError(err.message);
            }
        };

        fetchData();

        // WebSocket for real-time updates
        const socket = new WebSocket('ws://localhost:4000/ws');

        socket.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.eventId !== eventId) return;

            if (data.type === 'EVENT_ACTIVE') {
                setEvent((prev: any) => ({ ...prev, status: 'active', referenceImageUrl: data.imageUrl }));
            } else if (data.type === 'PLAYER_JOINED') {
                setPlayers((prev) => {
                    const exists = prev.find(p => p.email === data.player.email);
                    if (exists) return prev;
                    return [...prev, data.player];
                });
            } else if (data.type === 'SCORE_UPDATE') {
                setPlayers((prev) => {
                    const newPlayers = prev.map(p =>
                        p.name === data.player.name ? { ...p, score: data.player.score } : p
                    );
                    return [...newPlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
                });
            }
        };

        return () => socket.close();
    }, [eventId]);

    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-rose-950 text-white">
            <div className="text-center p-8 bg-rose-900 rounded-xl border border-red-500">
                <h1 className="text-2xl font-bold mb-2">Error</h1>
                <p>{error}</p>
            </div>
        </div>
    );

    if (!event) return (
        <div className="flex items-center justify-center min-h-screen bg-rose-950 text-white">
            <div className="text-2xl font-bold italic animate-pulse">Initializing Arena...</div>
        </div>
    );

    const playUrl = `http://localhost:3000/play/${eventId}`;

    return (
        <div className="flex flex-col min-h-screen bg-rose-950 text-white p-12">
            <header className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-6xl font-black tracking-tighter uppercase mb-2">AI PROMPT ARENA</h1>
                    <p className="text-rose-400 font-mono uppercase tracking-[0.4em]">{event.name}</p>
                </div>
                <div className="px-6 py-2 bg-rose-800 rounded-full font-black text-sm uppercase tracking-widest animate-pulse">
                    {event.status === 'waiting' ? 'Waiting for first player...' : 'BATTLE IN PROGRESS'}
                </div>
            </header>

            <main className="flex gap-12 flex-1">
                {/* Visual Area */}
                <div className="flex-[2] bg-rose-900/20 rounded-3xl border-2 border-rose-800 flex flex-col items-center justify-center p-12 shadow-inner relative overflow-hidden">
                    {event.status === 'waiting' ? (
                        <div className="text-center animate-in zoom-in duration-700">
                            <div className="bg-white p-6 rounded-3xl shadow-2xl mb-8 mx-auto inline-block border-8 border-rose-500/20">
                                <QRCodeSVG value={playUrl} size={256} level="H" />
                            </div>
                            <h2 className="text-4xl font-black uppercase mb-4 tracking-tight">SCAN TO JOIN</h2>
                            <p className="text-rose-400 font-mono text-lg">{playUrl}</p>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col">
                            <h2 className="text-2xl font-black uppercase mb-6 text-center tracking-widest text-rose-300">REFERENCE IMAGE</h2>
                            <div className="flex-1 rounded-2xl overflow-hidden border-4 border-rose-500 shadow-2xl relative">
                                <img
                                    src={event.referenceImageUrl}
                                    className="w-full h-full object-cover"
                                    alt="Reference"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Leaderboard Area */}
                <div className="flex-1 flex flex-col">
                    <h2 className="text-3xl font-black uppercase mb-8 border-b-2 border-rose-800 pb-4">Rankings</h2>
                    <div className="space-y-4">
                        {players.length === 0 ? (
                            <div className="text-center py-12 text-rose-500 font-bold uppercase tracking-widest opacity-50">
                                Arena is empty
                            </div>
                        ) : (
                            players.map((player, idx) => (
                                <div
                                    key={idx}
                                    className={`p-6 rounded-2xl border flex items-center justify-between transition-all duration-500 ${idx === 0 && player.score > 0 ? 'bg-amber-500 text-rose-950 border-amber-300 scale-105 shadow-xl' : 'bg-rose-900/40 border-rose-800'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${idx === 0 && player.score > 0 ? 'bg-rose-950 text-amber-500' : 'bg-rose-700'}`}>
                                            {idx + 1}
                                        </div>
                                        <span className="text-xl font-bold uppercase truncate max-w-[150px]">{player.name}</span>
                                    </div>
                                    <span className="font-mono font-black text-xl">{Math.round(player.score || 0)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <footer className="mt-12 text-center text-rose-500 font-mono text-xs uppercase tracking-[0.5em]">
                Antigravity AI Engine • Built for Corporate Activation
            </footer>
        </div>
    );
}
