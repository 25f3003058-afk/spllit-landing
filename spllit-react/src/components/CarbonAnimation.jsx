import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CarbonAnimation = ({ onComplete }) => {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        // Step-by-step automated sequence
        const timers = [
            setTimeout(() => setPhase(1), 500),  // Show Tree
            setTimeout(() => setPhase(2), 2000), // Start leaves & first quote
            setTimeout(() => setPhase(3), 4500), // Final quote
            setTimeout(() => onComplete(), 7000) // Finish
        ];

        return () => timers.forEach(timer => clearTimeout(timer));
    }, [onComplete]);

    const leaves = [...Array(15)].map((_, i) => ({
        id: i,
        color: ['#10b981', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'][i % 5],
        delay: Math.random() * 2,
        x: Math.random() * 200 - 100,
        duration: 3 + Math.random() * 2
    }));

    return (
        <div className="relative h-80 w-full flex flex-col items-center justify-center overflow-hidden rounded-[2rem]">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-accent-green/10 via-transparent to-transparent" />

            <AnimatePresence mode="wait">
                {phase >= 1 && (
                    <motion.div
                        key="tree"
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="relative z-10"
                    >
                        {/* The Tree Structure (SVG) */}
                        <svg width="200" height="240" viewBox="0 0 200 240" className="drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <motion.path
                                d="M100 240 L100 180 M100 180 L70 140 M100 160 L130 130 M100 140 L100 100"
                                stroke="#5c4033"
                                strokeWidth="8"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1 }}
                            />
                            {/* Tree Crown (Abstract Circles for leaf clusters) */}
                            <circle cx="100" cy="100" r="40" fill="#10b981" fillOpacity="0.2" />
                            <circle cx="70" cy="120" r="35" fill="#34d399" fillOpacity="0.15" />
                            <circle cx="130" cy="115" r="35" fill="#059669" fillOpacity="0.15" />
                        </svg>

                        {/* Falling Leaves */}
                        {phase >= 2 && leaves.map((leaf) => (
                            <motion.div
                                key={leaf.id}
                                initial={{ opacity: 0, x: leaf.x, y: 80, rotate: 0 }}
                                animate={{
                                    opacity: [0, 1, 1, 0],
                                    y: 240,
                                    x: leaf.x + (Math.sin(leaf.id) * 40),
                                    rotate: 360
                                }}
                                transition={{
                                    duration: leaf.duration,
                                    delay: leaf.delay,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute top-0 left-1/2 w-4 h-6 rounded-full"
                                style={{ backgroundColor: leaf.color, boxShadow: `0 0 10px ${leaf.color}44` }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quotes/Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 pointer-events-none">
                <AnimatePresence mode="wait">
                    {phase === 2 && (
                        <motion.div
                            key="q1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center px-6"
                        >
                            <p className="text-white text-lg font-bold">By registering, you saved</p>
                            <p className="text-accent-green text-2xl font-black tracking-tight">1 CARBON CURRENCY</p>
                        </motion.div>
                    )}
                    {phase === 3 && (
                        <motion.div
                            key="q2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center px-6"
                        >
                            <p className="text-white text-xl font-bold italic">"1 drop can fill a pot"</p>
                            <p className="text-accent-green/80 text-sm mt-2 font-medium tracking-wide">Small steps, Giant impact.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Wind Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            x: [-100, 400],
                            opacity: [0, 0.2, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.7,
                            ease: "linear"
                        }}
                        className="absolute h-[1px] w-32 bg-white/20 blur-sm"
                        style={{ top: `${30 + i * 20}%` }}
                    />
                ))}
            </div>
        </div>
    );
};

export default CarbonAnimation;
