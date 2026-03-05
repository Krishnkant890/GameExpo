'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getEvent, submitPrompt } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, ShieldCheck, User, Send, RotateCcw, Target, Sparkles, Trophy } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import AIImagePanel from '@/components/AIImagePanel';
import PlayerImagePanel from '@/components/PlayerImagePanel';
import QRDisplay from '@/components/QRDisplay';

export default function ScreenPage() {
    const { eventId } = useParams() as { eventId: string };
    const [event, setEvent] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [lastSubmission, setLastSubmission] = useState<any>(null);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const fetchData = async () => {
        try {
            const eventData = await getEvent(eventId);
            setEvent(eventData);
            setPlayers(eventData.players || []);

            // Find most recent submission to show on Right Panel
            const submissions = (eventData.players || [])
                .filter((p: any) => p.generatedImageUrl)
                .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

            if (submissions.length > 0) {
                setLastSubmission(submissions[0]);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [eventId]);

    const handleSendPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || loading) return;

        setLoading(true);
        try {
            await submitPrompt(eventId, undefined, prompt);
            setPrompt('');
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const playUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/${eventId}` : '';
    const activePlayer = players.find(p => p.score === null);

    useEffect(() => {
        if (activePlayer) {
            setShowQR(false);
        }
    }, [activePlayer]);

    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-black text-rose-500 font-orbitron">
            <h1 className="text-4xl font-black italic">SYSTEM ERROR: {error}</h1>
        </div>
    );

    if (!event) return null;

    return (
        <div className="flex flex-col min-h-screen bg-[#050508] text-foreground p-8 font-inter relative overflow-hidden">
            <div className="scanline" />

            {/* HEADER */}
            <header className="text-center mb-8 z-10 relative">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative inline-block"
                >
                    <h1 className="text-6xl font-black font-orbitron tracking-tighter italic text-glow-blue leading-none mb-1">
                        PROMPT <span className="text-white">ARENA</span>
                    </h1>
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                </motion.div>
                <p className="text-sm font-orbitron uppercase tracking-[0.6em] text-primary/60 mt-2">
                    Think It. Type It. Beat The AI.
                </p>
            </header>

            <main className="flex gap-6 flex-1 z-10 items-stretch overflow-hidden">
                {/* LEFT PANEL - Leaderboard */}
                <div className="w-[22%] min-w-[300px] flex flex-col">
                    <Leaderboard players={players} />
                </div>

                {/* CENTER PANEL - Gameplay */}
                <div className="flex-1 flex flex-col gap-6">
                    {event.status === 'waiting' ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-glass rounded-[40px] border border-white/10 relative">
                            <QRDisplay url={playUrl} />
                            <div className="mt-8 text-center">
                                <p className="text-xl font-orbitron font-bold text-white mb-2 uppercase tracking-widest">Scan the QR code to join</p>
                                <p className="text-primary/60 font-orbitron font-bold text-xs uppercase tracking-[0.4em]">Players Registered: {players.length}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* AI Target Box */}
                            <div className="flex-1 min-h-[40%] bg-glass rounded-[32px] border border-white/10 relative overflow-hidden group">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-1 rounded-b-xl border border-t-0 border-primary/30 z-20 transition-all">
                                    <span className="text-[10px] font-orbitron font-black text-primary uppercase tracking-widest">
                                        {showQR ? 'SCAN TO JOIN GAME' : 'AI TARGET IMAGE'}
                                    </span>
                                </div>
                                {showQR ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                                        <div className="scale-[0.85] origin-center -mt-4">
                                            <QRDisplay url={playUrl} />
                                        </div>
                                        <p className="text-sm font-orbitron text-primary/80 animate-pulse tracking-widest uppercase font-bold mt-2">
                                            Waiting for Challenger...
                                        </p>
                                    </div>
                                ) : (
                                    <AIImagePanel imageUrl={event.referenceImageUrl} status={event.status} description={event.referencePrompt} />
                                )}
                            </div>

                            {/* VS & Match Info */}
                            <div className="flex items-center gap-6 h-[180px]">
                                {/* Current Player */}
                                <div className="flex-1 bg-glass rounded-3xl border border-white/10 p-6 flex items-center gap-6 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-primary/5 pattern-grid opacity-10" />
                                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                                        {activePlayer ? (
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activePlayer.name}`} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <User size={40} className="text-primary/20" />
                                        )}
                                    </div>
                                    <div className="relative">
                                        <h3 className="text-[10px] font-orbitron font-black text-primary uppercase tracking-[0.4em] mb-1">YOUR IMAGE</h3>
                                        <p className="text-3xl font-black font-orbitron text-white uppercase tracking-tighter">
                                            {activePlayer ? activePlayer.name : 'Waiting for Player'}
                                        </p>
                                        <p className="text-gold font-orbitron font-bold text-sm tracking-widest mt-1">
                                            {activePlayer ? '— Your Turn! —' : '— Queuing... —'}
                                        </p>
                                    </div>

                                    <div className="ml-auto w-20 h-20 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center rotate-45 group hover:rotate-90 transition-transform duration-500">
                                        <div className="-rotate-45 group-hover:-rotate-90 transition-transform duration-500">
                                            <span className="text-2xl font-black font-orbitron text-gold italic">VS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prompt Input Box */}
                            <div className="bg-glass rounded-2xl border border-white/10 p-3 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowQR(!showQR)}
                                    className="px-6 py-4 bg-rose-950/40 text-rose-500 border border-rose-500/30 rounded-xl font-orbitron font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2"
                                >
                                    <RotateCcw size={14} /> {showQR ? 'SHOW AI IMAGE' : 'PLAY AGAIN'}
                                </button>
                                <form onSubmit={handleSendPrompt} className="flex-1 flex gap-3">
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Type Your Prompt Here..."
                                        disabled={!activePlayer || loading}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-6 font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!activePlayer || loading || !prompt.trim()}
                                        className="px-10 py-4 bg-primary text-black rounded-xl font-black font-orbitron text-sm uppercase tracking-widest hover:bg-white transition-all shadow-glow shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'GENERATING...' : 'SEND'}
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT PANEL - Player Image */}
                <div className="w-[22%] min-w-[300px] flex flex-col">
                    <div className="flex-1 bg-glass rounded-[32px] border border-white/10 p-1 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-1 rounded-b-xl border border-t-0 border-accent/30 z-20">
                            <span className="text-[10px] font-orbitron font-black text-accent uppercase tracking-widest">YOUR IMAGE</span>
                        </div>
                        <PlayerImagePanel
                            imageUrl={lastSubmission?.generatedImageUrl}
                            lastPlayerName={lastSubmission?.name}
                        />
                    </div>
                </div>
            </main>

            {/* BOTTOM BAR */}
            <footer className="mt-8 flex justify-between items-center z-10 px-4">
                <div className="flex gap-16">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl border border-primary/30 flex items-center justify-center">
                            <Zap className="text-primary" size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] font-orbitron font-black text-primary/40 uppercase tracking-widest">AI WINS</span>
                            <div className="text-3xl font-black font-orbitron text-white leading-none">{event.aiWins || 0}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-xl border border-accent/30 flex items-center justify-center">
                            <Activity className="text-accent" size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] font-orbitron font-black text-accent/40 uppercase tracking-widest">HUMAN WINS</span>
                            <div className="text-3xl font-black font-orbitron text-white leading-none">{event.humanWins || 0}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 opacity-20 font-mono text-[9px] uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={12} />
                        <span>Security Link 1.0.4</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-success rounded-full animate-pulse" />
                        <span>Realtime Sync: Active</span>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                .pattern-grid {
                    background-size: 20px 20px;
                    background-image: linear-gradient(to right, #ffffff10 1px, transparent 1px), linear-gradient(to bottom, #ffffff10 1px, transparent 1px);
                }
                .shadow-glow {
                    box-shadow: 0 0 20px rgba(0, 210, 255, 0.3);
                }
            `}</style>
        </div>
    );
}
