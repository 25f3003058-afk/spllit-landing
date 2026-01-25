import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CarbonAnimation = ({ onComplete }) => {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 100),
            setTimeout(() => setPhase(2), 1200),
            setTimeout(() => onComplete(), 6000)
        ];
        return () => timers.forEach(t => clearTimeout(t));
    }, [onComplete]);

    const leafColors = ['#10B981', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];

    return (
        <div className="relative h-[480px] w-full flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] rounded-[2rem]">
            {/* Soft Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.15),transparent_75%)]" />

            {/* 1. THE TREE (Elegantly Structured) */}
            <div className="absolute top-8 w-full h-56 flex justify-center pt-2">
                <svg viewBox="0 0 200 180" className="w-64 h-auto drop-shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <motion.path
                        d="M100 180 L100 120 M100 130 L75 100 M100 125 L125 95 M100 100 L100 70"
                        stroke="#1a1a1a"
                        strokeWidth="6"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1 }}
                    />
                    <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                    >
                        <circle cx="100" cy="70" r="50" fill="url(#treeGrad1)" fillOpacity="0.15" />
                        <circle cx="65" cy="95" r="40" fill="url(#treeGrad2)" fillOpacity="0.1" />
                        <circle cx="135" cy="95" r="40" fill="url(#treeGrad1)" fillOpacity="0.1" />
                    </motion.g>
                    <defs>
                        <radialGradient id="treeGrad1"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="transparent" /></radialGradient>
                        <radialGradient id="treeGrad2"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="transparent" /></radialGradient>
                    </defs>
                </svg>
            </div>

            {/* 2. PREMIUM FALLING LEAVES */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(16)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: 100 + (Math.random() * 100 - 50), y: 50, opacity: 0 }}
                        animate={{
                            y: 420,
                            x: 100 + (Math.sin(i + Date.now() / 1000) * 120),
                            rotate: 720,
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            delay: Math.random() * 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute w-3 h-5 rounded-full"
                        style={{
                            backgroundColor: leafColors[i % 5],
                            borderRadius: '0 100% 0 100%',
                            boxShadow: `0 0 10px ${leafColors[i % 5]}44`,
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    />
                ))}
            </div>

            {/* 3. SLEEK MINIMALIST CAT (Redesigned) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-32 h-32 flex items-center justify-center"
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                        {/* Body - Layered & Sleek */}
                        <path d="M25 85 Q50 30 75 85" fill="#151515" />
                        <path d="M30 85 L70 85 L65 50 L35 50 Z" fill="#151515" />

                        {/* Tail - Elegant Curve */}
                        <motion.path
                            d="M75 85 Q95 75 80 40"
                            stroke="#151515"
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        />

                        {/* Head - Perfectly Round but stylized */}
                        <circle cx="50" cy="45" r="20" fill="#151515" />

                        {/* Ears - Sharp & Defined */}
                        <path d="M35 35 L30 10 L45 35 Z" fill="#151515" />
                        <path d="M65 35 L70 10 L55 35 Z" fill="#151515" />

                        {/* Eyes - High-End "Cyber-Glass" look */}
                        <g>
                            <circle cx="42" cy="45" r="4" fill="#065f46" />
                            <circle cx="42" cy="45" r="2.5" fill="#10B981" />
                            <circle cx="43" cy="44" r="1" fill="white" fillOpacity="0.8" />
                            <motion.circle
                                cx="42" cy="45" r="4.5" stroke="#10B981" strokeWidth="0.5" fill="none"
                                animate={{ opacity: [0.2, 0.8, 0.2] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            />
                        </g>
                        <g>
                            <circle cx="58" cy="45" r="4" fill="#065f46" />
                            <circle cx="58" cy="45" r="2.5" fill="#10B981" />
                            <circle cx="59" cy="44" r="1" fill="white" fillOpacity="0.8" />
                            <motion.circle
                                cx="58" cy="45" r="4.5" stroke="#10B981" strokeWidth="0.5" fill="none"
                                animate={{ opacity: [0.2, 0.8, 0.2] }}
                                transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
                            />
                        </g>

                        {/* Minimalist Face Details */}
                        <path d="M48 54 Q50 57 52 54" stroke="#10B981" strokeWidth="1" fill="none" strokeLinecap="round" />
                        <g stroke="white" strokeWidth="0.5" strokeOpacity="0.2">
                            <line x1="30" y1="52" x2="42" y2="52" />
                            <line x1="30" y1="56" x2="42" y2="54" />
                            <line x1="70" y1="52" x2="58" y2="52" />
                            <line x1="70" y1="56" x2="58" y2="54" />
                        </g>

                        {/* Animated Paws - Active Catching */}
                        <motion.g
                            animate={{ y: [0, -35, 0], x: [0, 20, 0], rotate: [0, 30, 0] }}
                            transition={{ repeat: Infinity, duration: 0.9, ease: "anticipate" }}
                        >
                            <circle cx="35" cy="82" r="4.5" fill="#151515" />
                        </motion.g>
                        <motion.g
                            animate={{ y: [0, -30, 0], x: [0, -15, 0], rotate: [0, -30, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: 0.15, ease: "anticipate" }}
                        >
                            <circle cx="65" cy="82" r="4.5" fill="#151515" />
                        </motion.g>
                    </svg>
                </motion.div>
            </div>

            {/* 4. CHAT BUBBLE - FULL VISIBILITY (Fixed Position) */}
            <AnimatePresence>
                {phase >= 2 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 50 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: -130, // Lowered significantly to avoid clipping
                            x: 0
                        }}
                        className="absolute z-50 flex justify-center w-full"
                    >
                        <div className="relative bg-white text-black px-10 py-6 rounded-[2.5rem] rounded-bl-none shadow-[0_30px_70px_rgba(0,0,0,0.5)] border-2 border-accent-green/5">
                            <div className="text-center px-2">
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-xl md:text-2xl font-[900] italic uppercase tracking-tight leading-none text-black"
                                >
                                    "ONE DROP CAN<br />FILL A POT"
                                </motion.p>
                                <div className="h-[2px] w-12 bg-accent-green mx-auto my-4 opacity-30" />
                                <p className="text-[12px] text-accent-green font-black tracking-[0.4em] uppercase">
                                    SAVE CARBON • SAVE BILLS
                                </p>
                            </div>

                            {/* Chat Tail - Styled to match bubble */}
                            <div className="absolute -left-[18px] bottom-0 w-8 h-8 flex items-end">
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
