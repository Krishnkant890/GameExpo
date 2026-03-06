'use client';

import { motion } from 'framer-motion';
import { User, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PlayerImagePanel({ imageUrl, lastPlayerName, isGenerating = false }: { imageUrl: string | null, lastPlayerName: string | null, isGenerating?: boolean }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [imageUrl]);

    return (
        <div className="w-full h-full relative group">
            <div className="w-full h-full bg-black/40 relative overflow-hidden flex flex-col items-center justify-center transition-all">
                {isGenerating ? (
                    <div className="text-center relative">
                        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="relative">
                                <Loader2 size={80} className="text-primary animate-spin" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black font-orbitron text-primary uppercase tracking-widest animate-pulse">GENERATING</h3>
                                <p className="font-orbitron text-[10px] text-white/50 uppercase tracking-[0.4em] leading-relaxed">AI is creating your image...</p>
                            </div>
                        </div>
                    </div>
                ) : imageUrl && imageUrl !== 'none' && !hasError ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative"
                    >
                        <img
                            src={imageUrl}
                            className="w-full h-full object-cover"
                            alt="Player Generation"
                            onError={() => setHasError(true)}
                        />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="font-orbitron font-black text-xs text-accent tracking-widest uppercase">{lastPlayerName}</p>
                        </div>
                    </motion.div>
                ) : hasError ? (
                    <div className="text-center relative w-full h-full flex items-center justify-center">
                        <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full scale-150 animate-pulse"></div>
                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <p className="font-orbitron font-black text-xs text-rose-500 tracking-widest uppercase">GENERATION FAILED</p>
                            <p className="font-orbitron text-[10px] text-white/50 uppercase tracking-widest">{lastPlayerName}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center relative">
                        <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="relative">
                                <User size={120} className="text-accent opacity-20" />
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-black font-orbitron text-accent opacity-40">?</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black font-orbitron text-white uppercase tracking-widest">YOUR IMAGE</h3>
                                <p className="font-orbitron text-[10px] text-accent/40 uppercase tracking-[0.4em] leading-relaxed italic">Will Appear Here</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

