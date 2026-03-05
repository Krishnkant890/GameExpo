'use client';

import { useState } from 'react';
import { createEvent } from '@/lib/api';
import Link from 'next/link';

export default function AdminPage() {
    const [name, setName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState('20');
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await createEvent(name, parseInt(maxPlayers));
            setEvent(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-rose-950 text-white p-8">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-black mb-2 tracking-tight uppercase">AI Arena Console</h1>
                <p className="text-rose-400 font-mono text-xs uppercase tracking-[0.3em]">Game Management</p>
            </header>

            <main className="w-full max-w-md">
                {!event ? (
                    <form onSubmit={handleCreate} className="bg-rose-900/30 p-10 rounded-3xl border border-rose-800 shadow-2xl space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-rose-400 mb-2">Event Title</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-rose-950 border-2 border-rose-800 rounded-xl px-4 py-3 focus:border-rose-500 text-white"
                                    required
                                    placeholder="e.g. Google Cloud Summit"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-rose-400 mb-2">Player Limit</label>
                                <input
                                    type="number"
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(e.target.value)}
                                    className="w-full bg-rose-950 border-2 border-rose-800 rounded-xl px-4 py-3 focus:border-rose-500 text-white"
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm font-bold">⚠️ {error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 px-6 py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all"
                        >
                            {loading ? 'Initializing...' : 'Launch AI Arena'}
                        </button>
                    </form>
                ) : (
                    <div className="bg-rose-900/30 p-10 rounded-3xl border-2 border-rose-500 shadow-2xl text-center space-y-8">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-2xl font-black uppercase text-white mb-2">{event.name}</h2>
                            <p className="font-mono text-rose-400 text-sm">Session ID: {event.id}</p>
                        </div>

                        <div className="grid gap-4">
                            <Link
                                href={`/screen/${event.id}`}
                                className="block bg-rose-600 hover:bg-rose-500 px-6 py-4 rounded-xl font-bold uppercase tracking-widest transition-all"
                            >
                                Open Main Screen
                            </Link>
                            <button
                                onClick={() => setEvent(null)}
                                className="text-rose-500 text-xs font-bold uppercase tracking-[0.3em] hover:text-white"
                            >
                                Reset Console
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
