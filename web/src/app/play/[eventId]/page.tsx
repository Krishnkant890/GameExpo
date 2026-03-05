'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { joinEvent, getEvent, submitPrompt, WS_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Cpu, Send, CheckCircle2, AlertTriangle, Loader2, Sparkles } from 'lucide-react';

export default function PlayPage() {
    const { eventId } = useParams() as { eventId: string };
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<'joining' | 'waiting' | 'active' | 'finished'>('joining');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [score, setScore] = useState<number | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const savedPlayer = localStorage.getItem(`player_${eventId}`);
        if (savedPlayer) {
            const { name, email } = JSON.parse(savedPlayer);
            setName(name);
            setEmail(email);
            setStatus('waiting');
        }
    }, [eventId]);

    useEffect(() => {
        if (status === 'joining') return;

        const connectWS = () => {
            const socket = new WebSocket(WS_URL);
            socketRef.current = socket;

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'EVENT_ACTIVE' && data.eventId === eventId) {
                    setStatus('active');
                }
            };

            socket.onclose = () => {
                setTimeout(connectWS, 3000);
            };
        };

        connectWS();

        const checkStatus = async () => {
            try {
                const event = await getEvent(eventId);
                if (event.status === 'active' && status === 'waiting') {
                    setStatus('active');
                } else if (event.status === 'finished') {
                    setStatus('finished');
                }
            } catch (err) { }
        };

        const interval = setInterval(checkStatus, 3000);
        return () => {
            socketRef.current?.close();
            clearInterval(interval);
        };
    }, [eventId, status]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await joinEvent(eventId, name, email, phone);
            localStorage.setItem(`player_${eventId}`, JSON.stringify({ name, email }));
            setStatus('waiting');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await submitPrompt(eventId, email, prompt);
            setScore(res.score);
            setGeneratedImage(res.imageUrl);
            setStatus('finished');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.05 }
    };

    const inputClasses = "w-full bg-black/40 border-b-2 border-primary/20 hover:border-primary/50 focus:border-primary px-4 py-4 focus:outline-none transition-all font-orbitron text-sm tracking-wider text-white placeholder:text-primary/20 placeholder:font-sans";

    if (status === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-6 overflow-hidden">
                <div className="scanline" />
                <motion.div
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10"
                >
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            className="inline-flex items-center gap-2 bg-success/10 text-success border border-success/30 px-6 py-2 rounded-full font-orbitron font-black text-xs uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(0,255,157,0.1)]"
                        >
                            <CheckCircle2 size={16} /> Transmission Success
                        </motion.div>
                        <h1 className="text-6xl font-black font-orbitron italic tracking-tighter text-glow-cyan leading-none">
                            {score} <span className="text-xl font-normal not-italic tracking-widest text-primary/40 block mt-2">TOTAL_PTS</span>
                        </h1>
                    </div>

                    {generatedImage && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-glass p-2 rounded-[40px] border border-white/10 shadow-2xl w-full aspect-square relative group"
                        >
                            <img src={generatedImage} alt="Neural Output" className="w-full h-full object-cover rounded-[32px]" />
                            <div className="absolute top-6 left-6 flex gap-2">
                                <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-orbitron font-bold text-primary border border-primary/20">NEURAL_IMAGE_OUT</span>
                            </div>
                        </motion.div>
                    )}

                    <p className="text-primary/40 text-[10px] font-orbitron uppercase text-center tracking-[0.3em] max-w-[200px] leading-relaxed">
                        Session archived. Check main hub for final rankings.
                    </p>
                </motion.div>
            </div>
        );
    }

    if (status === 'active') {
        return (
            <div className="flex flex-col min-h-screen bg-background text-white p-8 relative overflow-hidden">
                <div className="scanline" />
                <motion.div
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10"
                >
                    <header className="mb-12">
                        <div className="flex items-center gap-2 text-primary opacity-50 mb-2">
                            <Cpu size={14} />
                            <span className="text-[10px] font-orbitron font-black uppercase tracking-[0.4em]">Neural Link Established</span>
                        </div>
                        <h1 className="text-4xl font-black font-orbitron italic tracking-tighter uppercase leading-none">
                            RECREATE <br /><span className="text-primary text-glow-cyan">THE CORE</span>
                        </h1>
                        <p className="text-primary/40 text-[10px] font-medium uppercase tracking-widest mt-4 leading-relaxed">
                            Analyze reference vector on main terminal. Construct descriptive prompt.
                        </p>
                    </header>

                    <form onSubmit={handleSubmitPrompt} className="space-y-8">
                        <div className="relative group">
                            <div className="absolute -top-3 left-6 flex items-center gap-2 bg-background px-3 text-[10px] font-orbitron font-black text-primary uppercase tracking-widest z-10 border border-primary/20 rounded-full group-focus-within:border-primary group-focus-within:text-glow-cyan transition-all">
                                <Sparkles size={10} /> Neural Input
                            </div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-white/5 border-2 border-white/10 rounded-[32px] px-8 py-10 focus:outline-none focus:border-primary focus:bg-primary/5 text-white text-lg font-medium placeholder:text-white/10 min-h-[220px] transition-all"
                                required
                                placeholder="Quantum vectorized landscape with..."
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-accent text-[10px] font-orbitron font-black uppercase tracking-widest"
                            >
                                <AlertTriangle size={14} /> {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full relative group transition-all transform active:scale-95 ${loading ? 'opacity-80' : ''}`}
                        >
                            <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative bg-primary hover:bg-white text-black px-6 py-6 rounded-[24px] font-black font-orbitron text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-colors">
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        <span>ANALYZING...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>INITIATE SEND</span>
                                        <Send size={20} />
                                    </>
                                )}
                            </div>
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    if (status === 'waiting') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-8 text-center overscroll-none overflow-hidden">
                <div className="scanline" />
                <motion.div
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    className="relative z-10 flex flex-col items-center"
                >
                    <div className="w-48 h-48 relative mb-12">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-2 border-primary/20 border-t-primary rounded-full shadow-[0_0_80px_rgba(0,242,255,0.05)]"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 border-2 border-accent/20 border-b-accent rounded-full opacity-50"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                            <div className="font-orbitron font-black text-xs text-primary animate-pulse tracking-[.3em]">STANDBY</div>
                            <div className="text-[8px] font-mono text-white/20 mt-1">LINK_ESTABLISHED</div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-black font-orbitron italic tracking-tighter uppercase mb-4">
                        YOU ARE <span className="text-primary text-glow-cyan">SYNCED</span>, {name.split(' ')[0]}
                    </h1>
                    <p className="text-primary/40 font-mono text-[10px] uppercase tracking-[0.4em] max-w-xs leading-relaxed">
                        Awaiting central terminal authorization. Prepare your neural core for prompt construction.
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-white p-8 relative overflow-hidden">
            <div className="scanline" />
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10"
            >
                <header className="mb-14">
                    <motion.div
                        initial={{ opacity: 0.1 }}
                        animate={{ opacity: [0.1, 0.5, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-[10px] font-orbitron font-black text-primary uppercase tracking-[.65em] mb-4"
                    >
                        ANTIGRAVITY SYSTEMS
                    </motion.div>
                    <h1 className="text-6xl font-black font-orbitron italic tracking-tighter uppercase leading-[0.85] mb-2">
                        AI <br /><span className="text-primary text-glow-cyan">ARENA</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="h-[1px] flex-1 bg-primary/20" />
                        <span className="text-[10px] font-orbitron font-bold uppercase tracking-widest text-primary/40">Remote Uplink</span>
                        <span className="h-[1px] flex-1 bg-primary/20" />
                    </div>
                </header>

                <main>
                    <form onSubmit={handleJoin} className="space-y-6">
                        <div className="space-y-2 group">
                            <label className="flex items-center gap-2 text-[10px] font-orbitron font-black uppercase tracking-[0.3em] text-primary/40 group-focus-within:text-primary transition-colors">
                                <User size={12} /> Combatant Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={inputClasses}
                                required
                                placeholder="JON_DOE_v3"
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label className="flex items-center gap-2 text-[10px] font-orbitron font-black uppercase tracking-[0.3em] text-primary/40 group-focus-within:text-primary transition-colors">
                                <Mail size={12} /> Secure Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputClasses}
                                required
                                placeholder="JD@CYBER.GRID"
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label className="flex items-center gap-2 text-[10px] font-orbitron font-black uppercase tracking-[0.3em] text-primary/40 group-focus-within:text-primary transition-colors">
                                <Phone size={12} /> Uplink Code (Opt)
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={inputClasses}
                                placeholder="+XX XXX XXX XXXX"
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-accent text-xs font-bold font-orbitron flex items-center gap-2"
                            >
                                <AlertTriangle size={14} /> {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-10 bg-white hover:bg-primary text-black px-6 py-6 rounded-[24px] font-black font-orbitron text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'INITIATE JOIN'}
                        </button>
                    </form>
                </main>
            </motion.div>
        </div>
    );
}
