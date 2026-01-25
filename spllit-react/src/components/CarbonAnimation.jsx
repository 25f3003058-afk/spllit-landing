import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CarbonAnimation = ({ onComplete }) => {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 100),   // Scene reveals
            setTimeout(() => setPhase(2), 2500),  // Chat shows
            setTimeout(() => onComplete(), 7000)  // Ends
        ];
        return () => timers.forEach(t => clearTimeout(t));
    }, [onComplete]);

    const leafColors = ['#10B981', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];

    return (
        <div className="relative h-[400px] w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-[#000]">
            {/* Ambient Background */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_100%,#10b98133,transparent_70%)]" />

            <div className="relative w-full h-full flex flex-col items-center">
                {/* The Big Artistic Tree */}
                <div className="absolute top-4 w-64 h-64">
                    <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <defs>
                            <linearGradient id="trunkGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stopColor="#1a1a1a" />
                                <stop offset="100%" stopColor="#2d2d2d" />
                            </linearGradient>
                        </defs>
                        {/* Tree Trunk */}
                        <motion.path
                            d="M100 200 C100 150 90 130 70 100 M100 200 C100 150 110 130 130 100 M100 200 L100 140"
                            stroke="url(#trunkGrad)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5 }}
                        />
                        {/* Tree Canopy (Abstract Clouds) */}
                        <motion.g
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                        >
                            <circle cx="100" cy="80" r="45" fill="#10B981" fillOpacity="0.1" />
                            <circle cx="70" cy="90" r="35" fill="#34d399" fillOpacity="0.15" />
                            <circle cx="130" cy="95" r="35" fill="#059669" fillOpacity="0.15" />
                            <circle cx="100" cy="60" r="30" fill="#10B981" fillOpacity="0.2" />
                        </motion.g>
                    </svg>
                </div>

                {/* The Falling Leaves */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                x: 100 + (Math.random() * 100 - 50),
                                y: 60,
                                rotate: 0,
                                opacity: 0
                            }}
                            animate={{
                                y: 340,
                                x: 100 + (Math.sin(i + Date.now() / 1000) * 80),
                                rotate: 720,
                                opacity: [0, 1, 1, 0]
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                delay: 1 + Math.random() * 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute w-3 h-4 rounded-full"
                            style={{
                                backgroundColor: leafColors[i % 5],
                                borderRadius: '0 80% 0 80%',
                                boxShadow: `0 0 8px ${leafColors[i % 5]}44`
                            }}
                        />
                    ))}
                </div>

                {/* Animated Cat at the Bottom */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="relative w-24 h-24"
                    >
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Body */}
                            <path d="M30 80 Q50 40 70 80" fill="#333" />
                            {/* Head */}
                            <circle cx="50" cy="45" r="15" fill="#333" />
                            {/* Ears */}
                            <path d="M40 35 L35 25 L45 35 Z" fill="#333" />
                            <path d="M60 35 L65 25 L55 35 Z" fill="#333" />
                            {/* Tail */}
                            <motion.path
                                d="M70 80 Q90 80 85 60"
                                stroke="#333"
                                strokeWidth="4"
                                fill="none"
                                strokeLinecap="round"
                                animate={{ rotate: [0, 20, 0] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            />
                            {/* Playful Paws */}
                            <motion.circle
                                cx="40" cy="80" r="4" fill="#333"
                                animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
                            />
                            <motion.circle
                                cx="60" cy="80" r="4" fill="#333"
                                animate={{ y: [0, -15, 0], x: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6 }}
                            />
                            {/* Eyes */}
                            <circle cx="45" cy="43" r="2" fill="#10B981" />
                            <circle cx="55" cy="43" r="2" fill="#10B981" />
                        </svg>
                    </motion.div>
                </div>

                {/* Chat Bubble Quote */}
                <AnimatePresence>
                    {phase >= 2 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0, x: 60, y: -200 }}
                            animate={{ scale: 1, opacity: 1, x: 60, y: -240 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute p-4 bg-white rounded-2xl rounded-bl-none shadow-2xl max-w-[200px]"
                        >
                            <div className="relative">
                                <p className="text-black text-sm font-bold leading-tight">
                                    "ONE DROP CAN FILL A POT."
                                </p>
                                <p className="text-accent-green text-[10px] mt-2 font-black tracking-wider">
                                    SAVE CARBON NOW
                                </p>
                                {/* Bubble Notch */}
                                <div className="absolute -left-4 bottom-0 w-4 h-4 bg-white" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CarbonAnimation;
