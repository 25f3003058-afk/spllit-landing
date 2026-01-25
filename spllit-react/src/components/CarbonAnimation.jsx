import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CarbonAnimation = ({ onComplete }) => {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 100),   // Start immediate
            setTimeout(() => onComplete(), 3500)  // Fast transition
        ];
        return () => timers.forEach(t => clearTimeout(t));
    }, [onComplete]);

    const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

    return (
        <div className="relative h-64 w-full flex items-center justify-center overflow-hidden bg-[#050505]">
            {/* Ambient Background Rays */}
            <div className="absolute inset-0 opacity-20">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 10 + i * 5, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-accent-green/10 via-transparent to-transparent blur-3xl opacity-30"
                        style={{ rotate: `${i * 120}deg` }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Modern Abstract Eco-Bill Symbol */}
                <div className="relative w-24 h-24 mb-6">
                    {/* The "Spllit" Coin/Earth Hybrid */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="relative w-full h-full"
                    >
                        {/* Glassy Background */}
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl overflow-hidden">
                            {/* Animated Inner Glow */}
                            <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                            />
                        </div>

                        {/* Splitting Parts (Colorful) */}
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.2 }}
                                className="absolute inset-0"
                            >
                                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                                    <motion.path
                                        d={i === 0 ? "M50 50 L50 10 A40 40 0 0 1 90 50 Z" :
                                            i === 1 ? "M50 50 L90 50 A40 40 0 0 1 50 90 Z" :
                                                "M50 50 L50 90 A40 40 0 1 1 50 10 Z"}
                                        fill={colors[i]}
                                        fillOpacity="0.8"
                                        animate={{
                                            rotate: [0, i === 2 ? -2 : 2, 0],
                                            x: [0, i === 0 ? 5 : i === 1 ? -5 : 0, 0]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </svg>
                            </motion.div>
                        ))}

                        {/* Center Leaf (Integrated) */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1, type: "spring" }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white filter drop-shadow-[0_0_8px_white]">
                                <path d="M11 20L1 12L11 4V12L21 4V20L11 12V20Z" fill="white" fillOpacity="0.9" />
                            </svg>
                        </motion.div>
                    </motion.div>

                    {/* Particle Burst */}
                    <AnimatePresence>
                        {phase >= 1 && [...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0, x: 0, y: 0 }}
                                animate={{
                                    scale: [0, 1, 0],
                                    x: Math.cos(i * 45 * Math.PI / 180) * 80,
                                    y: Math.sin(i * 45 * Math.PI / 180) * 80
                                }}
                                transition={{ duration: 1.5, delay: 1 + i * 0.1 }}
                                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                                style={{ backgroundColor: colors[i % colors.length] }}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Unified Premium Quote */}
                <div className="h-12 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {phase >= 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, letterSpacing: "0.5em" }}
                                animate={{ opacity: 1, y: 0, letterSpacing: "0.1em" }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="text-center"
                            >
                                <span className="bg-gradient-to-r from-accent-green to-accent-emerald bg-clip-text text-transparent text-xl font-black uppercase tracking-widest italic">
                                    ONE DROP CAN FILL A POT.
                                </span>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ delay: 1, duration: 2 }}
                                    className="h-[1px] bg-gradient-to-r from-transparent via-accent-green to-transparent mt-2"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Subtle Wind Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            x: [-100, 500],
                            opacity: [0, 0.4, 0]
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            delay: i * 0.8,
                            ease: "linear"
                        }}
                        className="absolute h-[1px] w-48 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        style={{ top: `${20 + i * 20}%` }}
                    />
                ))}
            </div>
        </div>
    );
};

export default CarbonAnimation;
