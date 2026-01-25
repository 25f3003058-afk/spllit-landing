import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CarbonAnimation = ({ onComplete }) => {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 100),   // Scene reveals
            setTimeout(() => setPhase(2), 1500),  // Quote pops up faster
            setTimeout(() => onComplete(), 5500)  // Faster transition
        ];
        return () => timers.forEach(t => clearTimeout(t));
    }, [onComplete]);

    const leafColors = ['#10B981', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];

    return (
        <div className="relative h-[320px] w-full flex flex-col items-center justify-center overflow-hidden bg-[#050505]">
            {/* Ambient Background */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_100%,#10b98166,transparent_70%)]" />

            <div className="relative w-full h-full flex flex-col items-center">

                {/* 1. THE BIG TREE (Simplified & Elegant) */}
                <div className="absolute top-0 w-full h-40 flex justify-center pt-4">
                    <svg viewBox="0 0 200 120" className="w-48 h-auto drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <motion.path
                            d="M100 120 L100 80 M100 90 L80 70 M100 85 L120 65"
                            stroke="#1a1a1a"
                            strokeWidth="6"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                        />
                        <motion.g
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <circle cx="100" cy="50" r="40" fill="#10B981" fillOpacity="0.15" />
                            <circle cx="75" cy="65" r="30" fill="#34d399" fillOpacity="0.1" />
                            <circle cx="125" cy="65" r="30" fill="#059669" fillOpacity="0.1" />
                        </motion.g>
                    </svg>
                </div>

                {/* 2. FALLING LEAVES (More Dynamic) */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: 100 + (Math.random() * 80 - 40), y: 30, opacity: 0 }}
                            animate={{
                                y: 300,
                                x: 100 + (Math.sin(i + 1) * 60),
                                rotate: [0, 180, 360, 540],
                                opacity: [0, 1, 1, 0]
                            }}
                            transition={{
                                duration: 2.5 + Math.random(),
                                delay: Math.random() * 2,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute w-3 h-4"
                            style={{
                                backgroundColor: leafColors[i % 5],
                                borderRadius: '0 80% 0 80%',
                                boxShadow: `0 0 5px ${leafColors[i % 5]}66`
                            }}
                        />
                    ))}
                </div>

                {/* 3. THE ENHANCED PLAYING CAT (Interactive) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative w-24 h-24"
                    >
                        {/* Playful Jumping Logic */}
                        <motion.div
                            animate={{
                                y: [0, -15, 0],
                                rotate: [0, -5, 5, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                {/* Cat Body */}
                                <motion.path
                                    d="M30 80 Q50 40 70 80"
                                    fill="#222"
                                    animate={{ d: ["M30 80 Q50 40 70 80", "M30 80 Q50 35 70 80", "M30 80 Q50 40 70 80"] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                {/* Head */}
                                <circle cx="50" cy="45" r="14" fill="#222" />
                                {/* Ears */}
                                <path d="M42 35 L36 20 L48 35 Z" fill="#222" />
                                <path d="M58 35 L64 20 L52 35 Z" fill="#222" />
                                {/* Tail (Jumpy) */}
                                <motion.path
                                    d="M70 80 Q95 70 85 45"
                                    stroke="#222"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeLinecap="round"
                                    animate={{ rotate: [0, 45, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                />
                                {/* Playful Paws (Batting at leaves) */}
                                <motion.circle
                                    cx="35" cy="75" r="3" fill="#222"
                                    animate={{ y: [0, -25, 0], x: [0, 10, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                />
                                <motion.circle
                                    cx="65" cy="75" r="3" fill="#222"
                                    animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.7, delay: 0.1 }}
                                />
                                {/* Eyes (Responsive) */}
                                <motion.circle
                                    cx="46" cy="43" r="1.5" fill="#10B981"
                                    animate={{ scaleY: [1, 0.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 3, repeatDelay: 1 }}
                                />
                                <motion.circle
                                    cx="54" cy="43" r="1.5" fill="#10B981"
                                    animate={{ scaleY: [1, 0.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 3, repeatDelay: 1 }}
                                />
                            </svg>
                        </motion.div>
                    </motion.div>
                </div>

                {/* 4. THE QUOTE (Chat Box - Highly Visible) */}
                <AnimatePresence>
                    {phase >= 2 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0, y: 20, x: 20 }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                                y: -160,
                                x: 40,
                                rotate: [-5, 5, -2, 0]
                            }}
                            className="absolute z-20"
                        >
                            <div className="relative bg-white text-black px-6 py-4 rounded-3xl rounded-bl-none shadow-[0_15px_40px_rgba(0,0,0,0.4)] border border-accent-green/20">
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-base font-black italic leading-none whitespace-nowrap"
                                >
                                    "ONE DROP CAN FILL A POT"
                                </motion.p>
                                <p className="text-[10px] text-accent-green font-bold tracking-[0.2em] mt-2 uppercase">
                                    Split Bills • Save Carbon
                                </p>
                                {/* Chat Bubble Tail */}
                                <div className="absolute bottom-0 -left-3 w-6 h-6 bg-white" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />

                                {/* Shimmer Effect on Bubble */}
                                <motion.div
                                    animate={{ left: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-green/5 to-transparent skew-x-12 rounded-3xl pointer-events-none"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CarbonAnimation;
