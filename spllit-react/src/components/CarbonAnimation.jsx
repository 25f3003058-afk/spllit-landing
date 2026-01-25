import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CarbonAnimation = ({ onComplete }) => {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 100),   // Tree grows
            setTimeout(() => setPhase(2), 800),   // Leaves fall & Quote
            setTimeout(() => onComplete(), 4500)  // Fast transition to form
        ];
        return () => timers.forEach(t => clearTimeout(t));
    }, [onComplete]);

    const leafColors = ['#10B981', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];

    // Generate organic leaf positions
    const leaves = [...Array(20)].map((_, i) => ({
        id: i,
        color: leafColors[i % 5],
        x: Math.random() * 200 - 100,
        delay: 0.8 + Math.random() * 1.5,
        duration: 2 + Math.random() * 1.5,
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360
    }));

    return (
        <div className="relative h-72 w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
            {/* Soft Ambient Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_70%)]" />

            {/* Premium Artistic Tree */}
            <div className="relative z-10 scale-110">
                <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                    {/* Artistic Trunk - Hand-drawn feel */}
                    <motion.path
                        d="M100 180 Q100 140 100 100 M100 140 Q80 120 60 110 M100 130 Q120 110 140 105 M100 160 Q90 150 75 145 M100 155 Q115 145 125 135"
                        fill="none"
                        stroke="url(#trunkGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                    <defs>
                        <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#065f46" />
                        </linearGradient>
                    </defs>

                    {/* Abstract Tree Crown (Glowing Points) */}
                    {[...Array(6)].map((_, i) => (
                        <motion.circle
                            key={i}
                            cx={100 + (Math.cos(i) * 30)}
                            cy={90 + (Math.sin(i) * 25)}
                            r={15 + (i % 3) * 5}
                            fill="url(#crownGradient)"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.15 }}
                            transition={{ delay: 0.5 + (i * 0.1), duration: 0.8 }}
                        />
                    ))}
                    <defs>
                        <radialGradient id="crownGradient">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                    </defs>
                </svg>

                {/* Animated Falling Leaves (Premium Style) */}
                <AnimatePresence>
                    {phase >= 2 && leaves.map((leaf) => (
                        <motion.div
                            key={leaf.id}
                            initial={{
                                opacity: 0,
                                x: leaf.x,
                                y: 40,
                                rotate: leaf.rotation,
                                scale: 0
                            }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                y: 220,
                                x: leaf.x + (Math.sin(leaf.id + Date.now() / 1000) * 50),
                                rotate: leaf.rotation + 720,
                                scale: [0, 1, 0.8, 0]
                            }}
                            transition={{
                                duration: leaf.duration,
                                delay: leaf.delay,
                                ease: "easeInOut",
                                repeat: 0
                            }}
                            className="absolute top-0 left-1/2 -ml-2"
                            style={{
                                width: leaf.size,
                                height: leaf.size * 1.5,
                                backgroundColor: leaf.color,
                                borderRadius: '0% 100% 0% 100% / 0% 100% 0% 100%',
                                boxShadow: `0 0 15px ${leaf.color}55`,
                                backdropFilter: 'blur(2px)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Premium Quote Reveal */}
            <div className="absolute bottom-10 w-full px-6 overflow-hidden">
                <AnimatePresence mode="wait">
                    {phase >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="text-center"
                        >
                            <motion.span
                                className="block text-white/40 text-[10px] uppercase tracking-[0.6em] mb-2 font-black"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                Your Impact
                            </motion.span>
                            <span className="relative inline-block">
                                <span className="bg-gradient-to-r from-accent-green via-white to-accent-emerald bg-clip-text text-transparent text-xl md:text-2xl font-black italic tracking-tight">
                                    "ONE DROP CAN FILL A POT"
                                </span>
                                {/* Elegant shimmer under the text */}
                                <motion.div
                                    className="absolute -bottom-1 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-green to-transparent"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 2, delay: 0.8 }}
                                />
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Interactive Light Trails */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            x: [-200, 600],
                            opacity: [0, 0.3, 0],
                            scaleY: [1, 2, 1]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 1,
                            ease: "linear"
                        }}
                        className="absolute h-[1px] w-40 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-sm"
                        style={{ top: `${25 + i * 25}%` }}
                    />
                ))}
            </div>
        </div>
    );
};

export default CarbonAnimation;
