import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CarbonAnimation = ({ onComplete }) => {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 100),
            setTimeout(() => setPhase(2), 1000), // Speed up interaction
            setTimeout(() => onComplete(), 5000)
        ];
        return () => timers.forEach(t => clearTimeout(t));
    }, [onComplete]);

    const leafColors = ['#10B981', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];

    return (
        <div className="relative h-[320px] w-full flex flex-col items-center justify-center bg-[#050505] rounded-[1.5rem] overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.2),transparent_70%)]" />

            {/* 1. THE TREE (Minimalist & Sleek) */}
            <div className="absolute top-0 w-full h-32 flex justify-center pt-2 opacity-40">
                <svg viewBox="0 0 200 120" className="w-40 h-auto">
                    <motion.path
                        d="M100 120 L100 80 M100 90 L85 70 M100 85 L115 65"
                        stroke="#1a1a1a"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                    />
                    <circle cx="100" cy="50" r="35" fill="#10B981" fillOpacity="0.1" />
                    <circle cx="80" cy="65" r="25" fill="#10B981" fillOpacity="0.05" />
                    <circle cx="120" cy="65" r="25" fill="#10B981" fillOpacity="0.05" />
                </svg>
            </div>

            {/* 2. DYNAMIC LEAVES (Fast & Colorful) */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: 100 + (Math.random() * 60 - 30), y: 40, opacity: 0 }}
                        animate={{
                            y: 350,
                            x: 100 + (Math.sin(i) * 80),
                            rotate: 360,
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                            duration: 2,
                            delay: Math.random() * 2,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute w-2.5 h-4"
                        style={{
                            backgroundColor: leafColors[i % 5],
                            borderRadius: '0 100% 0 100%',
                            boxShadow: `0 0 8px ${leafColors[i % 5]}33`
                        }}
                    />
                ))}
            </div>

            {/* 3. PREMIUM CAT (Glossy & Active) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="relative w-20 h-20"
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,1)]">
                        {/* Shadow */}
                        <ellipse cx="50" cy="92" rx="15" ry="3" fill="black" fillOpacity="0.4" />

                        {/* Body - High End Glossy Black */}
                        <path d="M30 85 C40 40 60 40 70 85" fill="#111" stroke="#222" strokeWidth="0.5" />

                        {/* Tail - Smooth Animation */}
                        <motion.path
                            d="M70 85 Q90 80 85 55"
                            stroke="#111"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            animate={{ rotate: [0, 20, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />

                        {/* Head */}
                        <circle cx="50" cy="48" r="16" fill="#111" stroke="#222" strokeWidth="0.5" />

                        {/* Ears */}
                        <path d="M40 38 L35 25 L45 38 Z" fill="#111" />
                        <path d="M60 38 L65 25 L55 38 Z" fill="#111" />

                        {/* Eyes - Glowing Emerald */}
                        <circle cx="45" cy="48" r="2.5" fill="#10B981" />
                        <circle cx="55" cy="48" r="2.5" fill="#10B981" />
                        <motion.circle
                            cx="45.5" cy="47.5" r="0.5" fill="white"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />
                        <motion.circle
                            cx="55.5" cy="47.5" r="0.5" fill="white"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />

                        {/* Playful Paws */}
                        <motion.circle
                            cx="40" cy="80" r="3" fill="#111"
                            animate={{ y: [0, -30, 0], x: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 0.7 }}
                        />
                        <motion.circle
                            cx="60" cy="80" r="3" fill="#111"
                            animate={{ y: [0, -25, 0], x: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                        />
                    </svg>
                </motion.div>
            </div>

            {/* 4. CHAT BUBBLE - SAFE POSITIONING (No Clipping) */}
            <AnimatePresence>
                {phase >= 2 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 100 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: -150, // Positioned inside the h-[320px] box 
                            x: 0
                        }}
                        className="absolute z-20 flex justify-center w-full"
                    >
                        <div className="relative bg-white text-black px-6 py-4 rounded-2xl rounded-bl-none shadow-2xl border-2 border-accent-green/5">
                            <div className="text-center">
                                <p className="text-lg md:text-xl font-black italic uppercase tracking-tighter leading-none">
                                    "ONE DROP CAN<br />FILL A POT"
                                </p>
                                <p className="text-[10px] text-accent-green font-black tracking-[0.2em] mt-3 uppercase">
                                    SAVE CARBON • SAVE BILLS
                                </p>
                            </div>
                            {/* Chat Tail */}
                            <div className="absolute -left-[14px] bottom-0 w-6 h-6 flex items-end">
                                <div className="w-full h-full bg-white" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CarbonAnimation;
