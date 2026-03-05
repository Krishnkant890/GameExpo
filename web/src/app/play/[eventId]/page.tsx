'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { joinEvent, getEvent, submitPrompt } from '@/lib/api';

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

        // WebSocket for real-time status updates
        const socket = new WebSocket('ws://localhost:4000/ws');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'EVENT_ACTIVE' && data.eventId === eventId) {
                setStatus('active');
            }
        };

        // Fallback polling
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
            socket.close();
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

    if (status === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-950 text-white p-8 text-center">
                <h1 className="text-4xl font-black mb-4 uppercase ">Score: {score} PTS</h1>
                {generatedImage && (
                    <div className="mb-6 rounded-2xl overflow-hidden border-4 border-indigo-400 shadow-2xl">
                        <img src={generatedImage} alt="Your Generation" className="w-full max-w-sm" />
                    </div>
                )}
                <p className="text-indigo-200 text-lg max-w-xs">
                    Great attempt! Check the leaderboard to see how you rank.
                </p>
            </div>
        );
    }

    if (status === 'active') {
        return (
            <div className="flex flex-col min-h-screen bg-indigo-950 text-white p-6 justify-center">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic">RECREATE THE IMAGE</h1>
                    <p className="text-indigo-300 text-sm mt-2">Type the prompt you think generated that image!</p>
                </header>
                <main className="w-full max-w-sm mx-auto">
                    <form onSubmit={handleSubmitPrompt} className="space-y-6">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-indigo-900/50 border-2 border-indigo-400 rounded-2xl px-6 py-4 focus:outline-none text-white text-lg font-bold placeholder:text-indigo-700 min-h-[150px]"
                            required
                            placeholder="Describe the image..."
                        />
                        {error && <div className="text-red-400 text-sm font-bold">⚠️ {error}</div>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-black px-6 py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all"
                        >
                            {loading ? 'GENERATING...' : 'SUBMIT PROMPT'}
                        </button>
                    </form>
                </main>
            </div>
        );
    }

    if (status === 'waiting') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-950 text-white p-8 text-center">
                <div className="relative mb-8">
                    <div className="w-32 h-32 border-4 border-indigo-500/30 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-400">READY</div>
                </div>
                <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">You're In, {name}!</h1>
                <p className="text-indigo-400 font-bold uppercase tracking-[0.2em]">Waiting for the game to start...</p>
                <p className="text-xs text-indigo-500 mt-8">The screen will update automatically.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-indigo-950 text-white p-6 justify-center">
            <header className="mb-12 text-center">
                <h1 className="text-5xl font-black uppercase tracking-tighter leading-none italic">
                    AI <span className="text-indigo-400">ARENA</span>
                </h1>
                <p className="text-indigo-300 font-bold mt-2 uppercase tracking-widest text-xs">Corporate Activation</p>
            </header>

            <main className="w-full max-w-sm mx-auto">
                <form onSubmit={handleJoin} className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-indigo-900/50 border-2 border-indigo-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-400 text-white"
                        required
                        placeholder="Full Name"
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-indigo-900/50 border-2 border-indigo-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-400 text-white"
                        required
                        placeholder="Email Address"
                    />
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-indigo-900/50 border-2 border-indigo-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-400 text-white"
                        placeholder="Phone (Optional)"
                    />

                    {error && <div className="text-red-400 text-sm font-bold">⚠️ {error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-400 px-6 py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20"
                    >
                        {loading ? 'Entering...' : 'Enter Arena'}
                    </button>
                </form>
            </main>
        </div>
    );
}
