import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CarbonAnimation = ({ onComplete }) => {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 100),
            setTimeout(() => setPhase(2), 1500),
            setTimeout(() => onComplete(), 6000)
        ];
        return () => timers.forEach(t => clearTimeout(t));
    }, [onComplete]);

    const leafColors = ['#10B981', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];

    return (
        <div className="relative h-[350px] w-full flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">
            {/* Soft Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.1),transparent_70%)]" />

            {/* 1. THE TREE (Artistic & Layered) */}
            <div className="absolute top-0 w-full h-44 flex justify-center pt-2">
                <svg viewBox="0 0 200 150" className="w-56 h-auto drop-shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <motion.path
                        d="M100 150 L100 100 M100 110 L80 85 M100 105 L120 80 M100 90 L100 60"
                        stroke="#1f1f1f"
                        strokeWidth="5"
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
                        <circle cx="100" cy="60" r="45" fill="url(#treeGrad1)" fillOpacity="0.2" />
                        <circle cx="70" cy="80" r="35" fill="url(#treeGrad2)" fillOpacity="0.15" />
                        <circle cx="130" cy="80" r="35" fill="url(#treeGrad1)" fillOpacity="0.15" />
                    </motion.g>
                    <defs>
                        <radialGradient id="treeGrad1"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="transparent" /></radialGradient>
                        <radialGradient id="treeGrad2"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="transparent" /></radialGradient>
                    </defs>
                </svg>
            </div>

            {/* 2. PREMIUM FALLING LEAVES */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(14)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: 100 + (Math.random() * 80 - 40), y: 40, opacity: 0 }}
                        animate={{
                            y: 340,
                            x: 100 + (Math.sin(i + Date.now() / 1000) * 100),
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

            {/* 3. PREMIUM ILLUSTRATED CAT (Detailed) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-28 h-28"
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                        {/* Shadow */}
                        <ellipse cx="50" cy="95" rx="20" ry="5" fill="black" fillOpacity="0.2" />

                        {/* Body - Soft Gradient Black */}
                        <path d="M30 85 Q50 35 70 85" fill="#1a1a1a" />
                        <path d="M35 85 L65 85 L60 45 L40 45 Z" fill="#1a1a1a" />

                        {/* Tail - Expressive */}
                        <motion.path
                            d="M70 85 Q95 80 85 50"
                            stroke="#1a1a1a"
                            strokeWidth="5"
                            fill="none"
                            strokeLinecap="round"
                            animate={{ rotate: [0, 30, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />

                        {/* Head - Detailed */}
                        <circle cx="50" cy="45" r="18" fill="#1a1a1a" />

                        {/* Ears with Pink Inner */}
                        <path d="M38 35 L32 15 L48 35 Z" fill="#1a1a1a" />
                        <path d="M41 33 L36 21 L46 33 Z" fill="#ff9999" fillOpacity="0.4" />

                        <path d="M62 35 L68 15 L52 35 Z" fill="#1a1a1a" />
                        <path d="M59 33 L64 21 L54 33 Z" fill="#ff9999" fillOpacity="0.4" />

                        {/* Eyes - Glowing Emerald */}
                        <g>
                            <circle cx="43" cy="45" r="3" fill="#10B981" />
                            <circle cx="43" cy="45" r="1" fill="black" />
                            <motion.circle
                                cx="44" cy="44" r="0.5" fill="white"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                        </g>
                        <g>
                            <circle cx="57" cy="45" r="3" fill="#10B981" />
                            <circle cx="57" cy="45" r="1" fill="black" />
                            <motion.circle
                                cx="58" cy="44" r="0.5" fill="white"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                        </g>

                        {/* Nose & Whiskers */}
                        <path d="M48 52 L52 52 L50 54 Z" fill="#ff9999" />
                        <g stroke="white" strokeWidth="0.5" strokeOpacity="0.3">
                            <line x1="35" y1="50" x2="45" y2="52" />
                            <line x1="35" y1="55" x2="45" y2="54" />
                            <line x1="65" y1="50" x2="55" y2="52" />
                            <line x1="65" y1="55" x2="55" y2="54" />
                        </g>

                        {/* Playful Paws - Batting faster */}
                        <motion.g
                            animate={{ y: [0, -35, 0], x: [0, 15, 0], rotate: [0, 45, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                        >
                            <circle cx="35" cy="80" r="4" fill="#1a1a1a" />
                            <path d="M33 78 L37 78" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
                        </motion.g>
                        <motion.g
                            animate={{ y: [0, -30, 0], x: [0, -15, 0], rotate: [0, -45, 0] }}
                            transition={{ repeat: Infinity, duration: 0.7, delay: 0.2 }}
                        >
                            <circle cx="65" cy="80" r="4" fill="#1a1a1a" />
                            <path d="M63 78 L67 78" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
                        </motion.g>
                    </svg>
                </motion.div>
            </div>

            {/* 4. PREMIUM CHAT BOX (Elegant & Sharp) */}
            <AnimatePresence>
                {phase >= 2 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 0, x: 20 }}
                        animate={{ scale: 1, opacity: 1, y: -160, x: 50 }}
                        className="absolute z-20"
                    >
                        <div className="relative bg-white text-black px-8 py-5 rounded-[2rem] rounded-bl-none shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
                            <motion.p
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg font-black italic uppercase leading-none"
                            >
                                "ONE DROP CAN FILL A POT"
                            </motion.p>
                            <p className="text-[11px] text-accent-green font-black tracking-[0.3em] mt-3 uppercase border-t border-gray-100 pt-2">
                                SAVE CARBON • SAVE BILLS
                            </p>

                            {/* Glassy Shimmer */}
                            <motion.div
                                animate={{ left: ['-100%', '200%'] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-green/5 to-transparent skew-x-12 pointer-events-none rounded-[2rem]"
                            />
                            {/* Chat Tail */}
                            <div className="absolute -left-3 bottom-0 w-6 h-6 bg-white" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CarbonAnimation;
