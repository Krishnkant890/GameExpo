'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getEvent, WS_URL } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trophy, Target, Zap, Activity, ShieldCheck } from 'lucide-react';

export default function ScreenPage() {
    const { eventId } = useParams() as { eventId: string };
    const [event, setEvent] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);

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

        const connectWS = () => {
            const socket = new WebSocket(WS_URL);
            socketRef.current = socket;

            socket.onopen = () => setConnected(true);
            socket.onclose = () => {
                setConnected(false);
                setTimeout(connectWS, 3000);
            };

            socket.onmessage = (msg) => {
                const data = JSON.parse(msg.data);
                if (data.eventId !== eventId) return;

                if (data.type === 'EVENT_ACTIVE') {
                    setEvent((prev: any) => ({ ...prev, status: 'active', referenceImageUrl: data.imageUrl }));
                } else if (data.type === 'PLAYER_JOINED') {
                    setPlayers((prev) => {
                        const exists = prev.find(p => p.email === data.player.email);
                        if (exists) return prev;
                        return [...prev, { ...data.player, score: 0 }];
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
        };

        connectWS();
        return () => socketRef.current?.close();
    }, [eventId]);

    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-black text-rose-500 font-orbitron">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-12 bg-rose-500/10 rounded-3xl border-2 border-rose-500 neon-border-magenta"
            >
                <h1 className="text-4xl font-black mb-4 animate-pulse">SYSTEM ERROR</h1>
                <p className="font-mono">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 border border-rose-500 rounded-full text-xs uppercase hover:bg-rose-500 hover:text-black transition-all">Reboot System</button>
            </motion.div>
        </div>
    );

    if (!event) return (
        <div className="flex items-center justify-center min-h-screen bg-black overflow-hidden">
            <div className="relative">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-32 h-32 border-t-4 border-primary rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center font-orbitron font-black text-primary text-xs tracking-widest">
                    BOOT
                </div>
            </div>
        </div>
    );

    const playUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/${eventId}` : '';

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground p-8 font-inter relative overflow-hidden">
            <div className="scanline" />

            {/* Header HUD */}
            <header className="flex justify-between items-center mb-10 z-10">
                <div className="relative">
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex flex-col"
                    >
                        <h1 className="text-5xl font-black font-orbitron tracking-tighter italic text-primary text-glow-cyan leading-none">
                            ARENA <span className="text-accent text-glow-magenta opacity-80">01</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="h-[2px] w-12 bg-primary shadow-[0_0_10px_#00f2ff]" />
                            <p className="text-[10px] font-orbitron uppercase tracking-[0.4em] text-primary opacity-60">
                                {event.name} • DEPLOYMENT PHASE: {event.status.toUpperCase()}
                            </p>
                        </div>
                    </motion.div>
                </div>

                <div className="flex gap-6 items-center bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] uppercase tracking-widest text-primary font-bold opacity-50 mb-1">Status</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-rose-500'}`} />
                            <span className="text-[10px] uppercase font-orbitron font-bold">{connected ? 'Online' : 'Reconnecting'}</span>
                        </div>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] uppercase tracking-widest text-primary font-bold opacity-50 mb-1">Combatants</span>
                        <div className="flex items-center gap-1">
                            <Users size={12} className="text-primary" />
                            <span className="text-lg font-orbitron font-black leading-none">{players.length}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex gap-8 flex-1 z-10">
                {/* Left: Main Action Display */}
                <motion.div
                    layout
                    className="flex-[2] flex flex-col gap-6"
                >
                    <div className="flex-1 bg-glass rounded-[40px] border border-white/10 relative overflow-hidden flex flex-col items-center justify-center p-12 group">

                        {/* HUD Decorations */}
                        <div className="absolute top-0 left-0 p-4 opacity-30">
                            <Activity size={24} className="text-primary" />
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-30">
                            <Zap size={24} className="text-accent" />
                        </div>
                        <div className="absolute bottom-0 left-0 p-4 opacity-30">
                            <ShieldCheck size={24} className="text-success" />
                        </div>

                        {event.status === 'waiting' ? (
                            <div className="flex flex-col items-center max-w-md w-full">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-white p-6 rounded-[32px] shadow-2xl mb-10 relative overflow-hidden group/qr"
                                >
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-full h-[2px] bg-primary shadow-lg animate-scanline-fast" />
                                    </div>
                                    <QRCodeSVG value={playUrl} size={280} level="H" />
                                </motion.div>

                                <div className="text-center">
                                    <h2 className="text-3xl font-black font-orbitron mb-2 tracking-tight text-glow-cyan">SCAN TO AUTHENTICATE</h2>
                                    <p className="text-primary/60 font-mono text-xs uppercase tracking-widest">{playUrl}</p>
                                </div>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key="battle"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full h-full flex flex-col"
                                >
                                    <h2 className="text-xs font-black font-orbitron uppercase tracking-[0.5em] mb-6 text-center text-primary/40">REFERENCE VECTOR 0.1</h2>
                                    <div className="flex-1 rounded-[32px] overflow-hidden border-2 border-primary/30 relative shadow-[0_0_50px_rgba(0,242,255,0.1)]">
                                        <img
                                            src={event.referenceImageUrl}
                                            className="w-full h-full object-cover"
                                            alt="Reference"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                            <div className="flex items-center gap-4">
                                                <Target className="text-primary animate-pulse" size={24} />
                                                <div>
                                                    <p className="text-[10px] uppercase font-orbitron font-black text-primary tracking-widest leading-none mb-1">Target Description</p>
                                                    <p className="text-xs font-bold text-white/80 max-w-xs">{event.status === 'active' ? 'Neural Network Seed: Vectorized AI Generation' : 'Game Finished'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </motion.div>

                {/* Right: Leaderboard HUD */}
                <div className="flex-1 flex flex-col min-w-[320px]">
                    <div className="bg-glass rounded-[40px] border border-white/10 flex-1 flex flex-col overflow-hidden">
                        <div className="p-8 pb-4 flex items-center gap-3">
                            <Trophy className="text-accent" size={24} />
                            <h2 className="text-xl font-black font-orbitron uppercase tracking-tighter">Rankings</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
                            <AnimatePresence>
                                {players.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.3 }}
                                        className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-white/5 rounded-3xl"
                                    >
                                        <Users className="mb-2 opacity-50" />
                                        <p className="text-[10px] uppercase font-orbitron font-bold tracking-[0.3em]">No Combatants</p>
                                    </motion.div>
                                ) : (
                                    players.map((player, idx) => (
                                        <motion.div
                                            key={player.email || player.name}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-5 rounded-2xl border transition-all relative overflow-hidden group ${idx === 0 && player.score > 0
                                                    ? 'bg-accent/10 border-accent neon-border-magenta scale-[1.02]'
                                                    : 'bg-white/5 border-white/10'
                                                }`}
                                        >
                                            {idx === 0 && player.score > 0 && (
                                                <div className="absolute top-0 right-0 p-2 opacity-40">
                                                    <Trophy size={14} className="text-accent" />
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs font-orbitron ${idx === 0 && player.score > 0 ? 'bg-accent text-white shadow-[0_0_15px_#ff007a]' : 'bg-white/10 text-white/50'
                                                        }`}>
                                                        0{idx + 1}
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-black uppercase tracking-tight truncate max-w-[120px]">{player.name}</span>
                                                        <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Active Link</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xl font-black font-orbitron ${idx === 0 && player.score > 0 ? 'text-accent' : 'text-primary'}`}>
                                                        {Math.round(player.score || 0)}
                                                    </span>
                                                    <span className="text-[8px] font-mono block opacity-30">SCORE</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-8 flex justify-between items-center opacity-40 font-mono text-[9px] uppercase tracking-[0.2em] relative z-10">
                <div className="flex items-center gap-4">
                    <span>GRID_SECURE_PROTO_v4.2</span>
                    <span className="h-1 w-1 bg-white rounded-full" />
                    <span>LATENCY_STABLE_4ms</span>
                </div>
                <span>ANTIGRAVITY_AI_UNIT_09 // 2026.03.05</span>
            </footer>

            <style jsx global>{`
                @keyframes scanline-fast {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(100vh); }
                }
                .animate-scanline-fast {
                    animation: scanline-fast 1s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
