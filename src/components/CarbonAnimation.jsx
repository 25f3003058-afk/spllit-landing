import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CarbonAnimation = ({ onComplete }) => {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 100),
            setTimeout(() => setPhase(2), 1200),
            setTimeout(() => onComplete(), 5500)
        ];
        return () => timers.forEach(t => clearTimeout(t));
    }, [onComplete]);

    const leafColors = ['#10B981', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];

    return (
        <div className="relative h-[400px] w-full flex flex-col items-center justify-end overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-[#000] rounded-[2rem] pb-4">
            {/* Soft Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.1),transparent_70%)]" />

            {/* 1. THE BIG TREE (More Artistic) */}
            <div className="absolute top-0 w-full flex justify-center pt-4 opacity-30">
                <svg viewBox="0 0 200 150" className="w-56 h-auto">
                    <motion.path
                        d="M100 150 L100 100 M100 110 L80 85 M100 105 L120 80 M100 90 L100 60"
                        stroke="#222"
                        strokeWidth="5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                    />
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <circle cx="100" cy="60" r="45" fill="#10B981" fillOpacity="0.1" />
                        <circle cx="70" cy="80" r="35" fill="#10B981" fillOpacity="0.05" />
                        <circle cx="130" cy="80" r="35" fill="#10B981" fillOpacity="0.05" />
                    </motion.g>
                </svg>
            </div>

            {/* 2. DYNAMIC LEAVES */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: 100 + (Math.random() * 80 - 40), y: 40, opacity: 0 }}
                        animate={{
                            y: 420,
                            x: 100 + (Math.sin(i + Date.now() / 1000) * 100),
                            rotate: 720,
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{ duration: 3 + Math.random(), delay: Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-3 h-5 rounded-full"
                        style={{ backgroundColor: leafColors[i % 5], borderRadius: '0 100% 0 100%', boxShadow: `0 0 10px ${leafColors[i % 5]}44` }}
                    />
                ))}
            </div>

            {/* 3. PREMIUM YELLOW TABBY CAT */}
            <div className="relative z-10 mb-2">
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-28 h-28"
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
                        {/* Shadow */}
                        <ellipse cx="50" cy="95" rx="20" ry="5" fill="black" fillOpacity="0.3" />

                        {/* Body - Warm Yellow/Amber */}
                        <path d="M30 85 Q50 35 70 85" fill="#FFB74D" />
                        <path d="M35 85 L65 85 L60 45 L40 45 Z" fill="#FFA726" />

                        {/* Tabby Stripes (Body) */}
                        <path d="M40 55 H60" stroke="#EF6C00" strokeWidth="1" strokeOpacity="0.3" />
                        <path d="M38 65 H62" stroke="#EF6C00" strokeWidth="1" strokeOpacity="0.3" />

                        {/* Tail - Expressive */}
                        <motion.path
                            d="M70 85 Q95 80 85 50"
                            stroke="#FFB74D"
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            animate={{ rotate: [0, 25, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 2.5 }}
                        />

                        {/* Head - Detailed */}
                        <circle cx="50" cy="45" r="20" fill="#FFB74D" />
                        <path d="M40 38 Q50 32 60 38" fill="none" stroke="#EF6C00" strokeWidth="1" strokeOpacity="0.5" />

                        {/* Ears with Inner Pink */}
                        <path d="M35 35 L30 15 L45 35 Z" fill="#FFB74D" />
                        <path d="M38 33 L35 22 L43 33 Z" fill="#FF8A80" fillOpacity="0.4" />

                        <path d="M65 35 L70 15 L55 35 Z" fill="#FFB74D" />
                        <path d="M62 33 L65 22 L57 33 Z" fill="#FF8A80" fillOpacity="0.4" />

                        {/* Eyes - Deep Dark with Glow */}
                        <g>
                            <circle cx="43" cy="45" r="4" fill="#3E2723" />
                            <circle cx="43" cy="45" r="1.5" fill="black" />
                            <circle cx="44" cy="44" r="1" fill="white" fillOpacity="0.8" />
                        </g>
                        <g>
                            <circle cx="57" cy="45" r="4" fill="#3E2723" />
                            <circle cx="57" cy="45" r="1.5" fill="black" />
                            <circle cx="58" cy="44" r="1" fill="white" fillOpacity="0.8" />
                        </g>

                        {/* Nose & Whiskers */}
                        <circle cx="50" cy="52" r="2" fill="#FF8A80" />
                        <g stroke="#EF6C00" strokeWidth="0.5" strokeOpacity="0.4">
                            <line x1="30" y1="50" x2="42" y2="52" />
                            <line x1="30" y1="56" x2="42" y2="54" />
                            <line x1="70" y1="50" x2="58" y2="52" />
                            <line x1="70" y1="56" x2="58" y2="54" />
                        </g>

                        {/* Paws */}
                        <motion.circle
                            cx="35" cy="82" r="5" fill="#FFA726"
                            animate={{ y: [0, -30, 0], x: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 0.9, ease: "anticipate" }}
                        />
                        <motion.circle
                            cx="65" cy="82" r="5" fill="#FFA726"
                            animate={{ y: [0, -25, 0], x: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 0.7, delay: 0.2, ease: "anticipate" }}
                        />
                    </svg>
                </motion.div>
            </div>

            {/* 4. CHAT BUBBLE - ANCHORED TO CAT (Prevents Overlap) - Responsive */}
            <AnimatePresence>
                {phase >= 2 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 0, x: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: -200, // Adjusted for mobile
                            x: 0 // Centered on mobile
                        }}
                        className="absolute z-50 pointer-events-none left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:y-[-220px] md:x-[40px]"
                    >
                        <div className="relative bg-white text-black px-4 py-3 md:px-8 md:py-5 rounded-2xl md:rounded-[2rem] rounded-bl-none shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-accent-green/10 max-w-[280px] md:max-w-none">
                            <div className="text-center">
                                <p className="text-sm md:text-xl font-black italic uppercase tracking-tight leading-tight md:leading-none whitespace-nowrap">
                                    "ONE DROP CAN<br />FILL A POT"
                                </p>
                                <div className="h-[1.5px] md:h-[2px] w-6 md:w-8 bg-accent-green mx-auto my-2 md:my-3 opacity-30" />
                                <p className="text-[8px] md:text-[10px] text-accent-green font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">
                                    SAVE CARBON • SAVE BILLS
                                </p>
                            </div>
                            {/* Chat Tail */}
                            <div className="absolute -left-2 md:-left-3 bottom-0 w-4 md:w-6 h-4 md:h-6 bg-white" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CarbonAnimation;
