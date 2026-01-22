import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HowItWorks from '../components/HowItWorks';
import { FaUser, FaCalculator, FaMoneyBillWave, FaArrowDown } from 'react-icons/fa';

// --- SVGs for Visual Logic ---
const ConnectorLine = ({ start, end }) => (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
        <motion.path
            d={`M ${start.x} ${start.y} C ${start.x} ${start.y + 50} ${end.x} ${end.y - 50} ${end.x} ${end.y}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="10 5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ duration: 0.5 }}
        />
        <motion.circle
            r="4"
            fill="#10b981"
            initial={{ offsetDistance: "0%" }}
            animate={{ offsetDistance: "100%" }}
            style={{ offsetPath: `path('M ${start.x} ${start.y} C ${start.x} ${start.y + 50} ${end.x} ${end.y - 50} ${end.x} ${end.y}')` }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
    </svg>
);

const SplitSimulator = () => {
    const [billAmount, setBillAmount] = useState(1200);
    const [peopleCount, setPeopleCount] = useState(4);
    const [splitAmount, setSplitAmount] = useState(0);

    useEffect(() => {
        setSplitAmount(Math.ceil(billAmount / peopleCount));
    }, [billAmount, peopleCount]);

    return (
        <div className="py-20 bg-bg-primary relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-green/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green mb-6"
                    >
                        <FaCalculator />
                        <span className="text-sm font-bold tracking-wider uppercase">Live Logic Demo</span>
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">See the Math in Action</h2>
                    <p className="text-text-secondary">Drag the sliders to simulate a real-world split scenario.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="bg-bg-secondary p-8 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-sm"
                    >
                        <div className="mb-10">
                            <label className="flex justify-between text-text-secondary mb-4 font-bold">
                                <span>Total Bill Amount</span>
                                <span className="text-white">₹ {billAmount}</span>
                            </label>
                            <input
                                type="range"
                                min="100"
                                max="5000"
                                step="50"
                                value={billAmount}
                                onChange={(e) => setBillAmount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-green"
                            />
                        </div>

                        <div className="mb-10">
                            <label className="flex justify-between text-text-secondary mb-4 font-bold">
                                <span>Number of People</span>
                                <span className="text-white">{peopleCount} Riders</span>
                            </label>
                            <input
                                type="range"
                                min="2"
                                max="10"
                                step="1"
                                value={peopleCount}
                                onChange={(e) => setPeopleCount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-green"
                            />
                            <div className="flex justify-between mt-2 px-1">
                                {[2, 4, 6, 8, 10].map(n => (
                                    <span key={n} className="text-xs text-gray-500">{n}</span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-bg-card p-6 rounded-2xl border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400 text-sm">Calculation</span>
                                <FaCalculator className="text-accent-green opacity-50" />
                            </div>
                            <div className="flex items-end gap-2 text-3xl font-mono text-white">
                                <span>₹{billAmount}</span>
                                <span className="text-accent-green">/</span>
                                <span>{peopleCount}</span>
                                <span className="text-accent-green">=</span>
                                <span className="text-accent-green font-bold">₹{splitAmount}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">Per person calculation is instant and automated.</div>
                        </div>
                    </motion.div>

                    {/* Visualization */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="relative h-[500px] flex flex-col items-center justify-between py-10"
                    >
                        {/* Source: The Bill */}
                        <motion.div
                            key={billAmount}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="relative z-20 w-32 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-center text-black font-bold text-xl border-b-4 border-green-800"
                        >
                            <FaMoneyBillWave className="mr-2" />
                            ₹{billAmount}
                            {/* Connector origin point */}
                            <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                        </motion.div>

                        {/* Arrow Logic */}
                        <div className="my-4 text-accent-green animate-bounce">
                            <FaArrowDown />
                        </div>

                        {/* Destination: The People */}
                        <div className="relative z-20 flex flex-wrap justify-center gap-4 w-full">
                            <AnimatePresence>
                                {Array.from({ length: peopleCount }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20, scale: 0 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex flex-col items-center"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-accent-green/30 flex items-center justify-center text-white relative group overflow-hidden">
                                            <div className="absolute inset-0 bg-accent-green/10 group-hover:bg-accent-green/20 transition-colors" />
                                            <FaUser className="z-10 text-xl" />
                                        </div>
                                        <div className="mt-2 text-center">
                                            <div className="text-xs text-gray-500">Rider {i + 1}</div>
                                            <div className="text-accent-green font-bold font-mono">₹{splitAmount}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const HowItWorksPage = () => {
    return (
        <div className="pt-20 min-h-screen bg-bg-primary">
            {/* Header Section */}
            <div className="bg-bg-secondary pt-20 pb-10 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-green/50 to-transparent" />
                <div className="container mx-auto px-6 text-center relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold mb-6 bg-white bg-clip-text text-transparent"
                    >
                        How It <span className="text-accent-green">Works</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-text-secondary max-w-2xl mx-auto"
                    >
                        From finding a ride to settling the cost, Spllit makes shared mobility effortless.
                    </motion.p>
                </div>
            </div>

            {/* Original Timeline Steps */}
            <HowItWorks />

            {/* New Interactive Simulator */}
            <SplitSimulator />
        </div>
    );
};

export default HowItWorksPage;

