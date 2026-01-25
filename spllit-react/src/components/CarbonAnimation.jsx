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

    // Luxury leaves with varied shapes and physics
    const leaves = [...Array(18)].map((_, i) => ({
        id: i,
        color: leafColors[i % 5],
        x: Math.random() * 260 - 130,
        delay: 1.5 + Math.random() * 2,
        duration: 3 + Math.random() * 2,
        size: 10 + Math.random() * 12,
        rotation: Math.random() * 360,
        sway: 40 + Math.random() * 40
    }));

    return (
        <div className="relative h-80 w-full flex flex-col items-center justify-center overflow-hidden bg-black">
            {/* Background Architecture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />

            <div className="relative z-10 w-full flex flex-col items-center justify-center -translate-y-4">
                {/* The "Living" Tree - Geometric Architecture */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <defs>
                            <linearGradient id="treeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stopColor="#064e3b" />
                                <stop offset="50%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2.5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Trunk - Tapered & Structured */}
                        <motion.path
                            d="M100 180 L100 100"
                            stroke="url(#treeGrad)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                        />

                        {/* Geometric Branches - Fractalline Logic */}
                        {[
                            "M100 150 L75 130 M100 135 L125 115",
                            "M100 120 L80 95 M100 110 L120 85",
                            "M100 90 L85 65 M100 80 L115 55"
                        ].map((d, i) => (
                            <motion.path
                                key={i}
                                d={d}
                                stroke="url(#treeGrad)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.8 }}
                                transition={{ delay: 0.5 + (i * 0.2), duration: 1.2 }}
                            />
                        ))}

                        {/* Golden Ratio Points (Abstract Fruit/Nodes) */}
                        {[...Array(12)].map((_, i) => (
                            <motion.circle
                                key={i}
                                cx={100 + (Math.cos(i * 1.6) * (20 + i * 4))}
                                cy={130 - (i * 8)}
                                r={2 + (i % 2)}
                                fill="#fbbf24"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: [0, 1.2, 1],
                                    opacity: [0, 1, 0.6],
                                    boxShadow: '0 0 10px #fbbf24'
                                }}
                                transition={{ delay: 1 + (i * 0.1), duration: 1, repeat: Infinity, repeatDelay: 3 }}
                            />
                        ))}
                    </svg>

                    {/* High-End Falling Leaves */}
                    <AnimatePresence>
                        {phase >= 2 && leaves.map((leaf) => (
                            <motion.div
                                key={leaf.id}
                                initial={{ opacity: 0, x: leaf.x, y: 20, rotate: leaf.rotation, scale: 0 }}
                                animate={{
                                    opacity: [0, 1, 1, 0],
                                    y: 280,
                                    x: leaf.x + (Math.sin(leaf.id) * leaf.sway),
                                    rotate: leaf.rotation + 720,
                                    scale: [0, 1.2, 1, 0]
                                }}
                                transition={{
                                    duration: leaf.duration,
                                    delay: leaf.delay,
                                    ease: "easeInOut"
                                }}
                                className="absolute top-0 left-1/2 -ml-2"
                                style={{
                                    width: leaf.size,
                                    height: leaf.size * 1.5,
                                    backgroundColor: leaf.color,
                                    borderRadius: '50% 0 50% 0', // Leaf shape
                                    boxShadow: `0 0 15px ${leaf.color}44`,
                                    border: `1px solid rgba(255,255,255,0.2)`
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Typography - Premium Reveal */}
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center">
                <AnimatePresence mode="wait">
                    {phase >= 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            {/* Decorative Line Decor */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "120px" }}
                                transition={{ delay: 1.5, duration: 1 }}
                                className="h-[1px] bg-gradient-to-r from-transparent via-accent-green to-transparent mb-6"
                            />

                            <div className="relative overflow-hidden px-4">
                                <motion.h2
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
                                    className="text-white text-3xl md:text-4xl font-extrabold tracking-tighter italic"
                                >
                                    ONE DROP <span className="bg-gradient-to-r from-accent-green to-accent-emerald bg-clip-text text-transparent">CAN FILL</span> A POT.
                                </motion.h2>

                                {/* Text Shine Overlay */}
                                <motion.div
                                    animate={{ left: ['-100%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 w-24 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                                />
                            </div>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 0.5, y: 0 }}
                                transition={{ delay: 2, duration: 1 }}
                                className="text-white text-[10px] uppercase tracking-[0.8em] mt-4 font-black"
                            >
                                SAVING THE PLANET • ONE SPLIT AT A TIME
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CarbonAnimation;
