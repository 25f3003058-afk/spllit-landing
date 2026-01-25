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

const coinAnimations = Array.from({ length: 6 }).map((_, i) => ({
    x: (i % 2 === 0 ? 50 : -50) * Math.random(),
    delay: i * 0.2
}));

const nodePositions = Array.from({ length: 3 }).map((_item, _index) => ({
    top: 30 + Math.random() * 40,
    left: 20 + Math.random() * 60
}));

const StoryFlow = () => {
    // Animation phases
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setPhase((prev) => (prev + 1) % 5);
        }, 5000); // 5 seconds per phase for better readability
        return () => clearInterval(timer);
    }, []);

    const phases = [
        { title: "The Search", desc: "Ravi requests a ride. The system activates.", color: "from-blue-500 to-cyan-400" },
        { title: "Hyper-Local Scan", desc: "Scanning 500m radius for optimized routes.", color: "from-purple-500 to-pink-500" },
        { title: "Smart Token", desc: "₹1 Token locks the commitment instantly.", color: "from-yellow-400 to-orange-500" },
        { title: "Instant Match", desc: "Route matched with Priya. Zero deviation.", color: "from-accent-green to-emerald-400" },
        { title: "Cost Spllit", desc: "Both save 40%. Seamless settlement.", color: "from-green-400 to-lime-400" }
    ];

    return (
        <section className="py-32 bg-black relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-accent-green/5 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6"
                    >
                        <span className="text-xs font-bold tracking-[0.3em] text-gray-300 uppercase">Live Journey</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                        How <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-400">Magic</span> Happens
                    </h2>
                </div>

                {/* Immersive Stage */}
                <div className="relative max-w-6xl mx-auto h-[400px] flex items-center justify-center">

                    {/* Living Map Background (Scales & Moves) */}
                    <div className="absolute inset-0 opacity-20 transform-gpu overflow-hidden">
                        <svg className="w-full h-full text-gray-800" stroke="currentColor" strokeWidth="1">
                            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                            {/* Styling Roads */}
                            <motion.path
                                d="M 0 200 Q 250 150 500 200 T 1000 200"
                                fill="none"
                                stroke="url(#roadGradient)"
                                strokeWidth="4"
                                strokeDasharray="10 20"
                                initial={{ strokeDashoffset: 0 }}
                                animate={{ strokeDashoffset: -1000 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            />
                            <defs>
                                <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="transparent" />
                                    <stop offset="20%" stopColor="#374151" />
                                    <stop offset="80%" stopColor="#374151" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* Central Cinema Area */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={phase}
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                            transition={{ duration: 0.5 }}
                            className="relative z-20 w-full flex flex-col items-center justify-center"
                        >
                            {/* PHASE 0: The Search - Pulse */}
                            {phase === 0 && (
                                <div className="relative">
                                    <div className="w-80 h-80 rounded-full border border-blue-500/10 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                        <div className="w-60 h-60 rounded-full border border-blue-500/20 border-dashed" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
                                            <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.4)]">
                                                <FaUser className="text-2xl text-white" />
                                            </div>
                                            {/* Ripple */}
                                            <motion.div
                                                className="absolute inset-0 border border-blue-400 rounded-full"
                                                animate={{ scale: [1, 2.5], opacity: [1, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                    </div>
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <div className="px-6 py-2 bg-blue-900/40 backdrop-blur-md rounded-xl border border-blue-500/30 text-blue-300 font-mono text-sm">
                                            Locating nearest hub...
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {/* PHASE 1: Scan - Radar */}
                            {phase === 1 && (
                                <div className="relative w-full max-w-2xl h-80 flex items-center justify-center">
                                    {/* Scan Line */}
                                    <motion.div
                                        className="absolute w-1 h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent z-10"
                                        animate={{ left: ["0%", "100%", "0%"] }}
                                        transition={{ duration: 3, ease: "linear" }}
                                    />
                                    {/* Nodes */}
                                    {nodePositions.map((pos, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute"
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: [0, 1, 0.5], scale: 1 }}
                                            transition={{ delay: (i + 1) * 0.5, duration: 2 }}
                                            style={{
                                                top: `${pos.top}%`,
                                                left: `${pos.left}%`
                                            }}
                                        >
                                            <div className="w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_15px_rgba(192,132,252,0.8)]" />
                                            <div className="text-[10px] text-purple-300 mt-1 font-mono">Passenger found</div>
                                        </motion.div>
                                    ))}
                                    <div className="w-20 h-20 rounded-full bg-purple-900/30 border border-purple-500/50 flex items-center justify-center">
                                        <FaUser className="text-2xl text-purple-200" />
                                    </div>
                                </div>
                            )}

                            {/* PHASE 2: Token - 3D Coin Effect */}
                            {phase === 2 && (
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        animate={{ rotateY: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_60px_rgba(234,179,8,0.5)] border-4 border-yellow-200 flex items-center justify-center mb-8 relative z-10"
                                        style={{ transformStyle: "preserve-3d" }}
                                    >
                                        <div className="absolute inset-0 bg-yellow-400 opacity-20 rounded-full blur-xl" />
                                        <span className="text-5xl font-black text-yellow-900 drop-shadow-sm">₹1</span>
                                    </motion.div>
                                    <div className="flex items-center gap-4 text-yellow-500 font-mono text-sm max-w-sm text-center">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                        <span>Wallet deduction verified</span>
                                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                    </div>
                                </div>
                            )}

                            {/* PHASE 3: Match - Connection */}
                            {phase === 3 && (
                                <div className="relative w-full max-w-lg flex flex-col md:flex-row items-center justify-between px-6 md:px-10 gap-8 md:gap-0">
                                    {/* User A */}
                                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center z-10">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-gray-800 to-black border border-gray-700 flex items-center justify-center shadow-2xl">
                                            <FaUser className="text-gray-400 text-xl md:text-2xl" />
                                        </div>
                                    </motion.div>

                                    {/* Connection Beam */}
                                    <div className="flex-1 w-2 md:w-auto h-24 md:h-2 bg-gray-800 rounded-full mx-0 md:mx-4 relative overflow-hidden">
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-accent-green via-emerald-400 to-accent-green"
                                            initial={{ y: "-100%", x: "-100%" }}
                                            animate={{ y: "0%", x: "0%" }}
                                            transition={{ duration: 0.8, ease: "circOut" }}
                                        />
                                        <div className="absolute inset-0 bg-accent-green/20 blur-md" />
                                    </div>

                                    {/* User B */}
                                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center z-10">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-accent-green to-emerald-700 border border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                                            <FaUser className="text-black text-xl md:text-2xl" />
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.6, type: "spring" }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                                    >
                                        <div className="px-4 py-1 md:px-6 md:py-2 bg-emerald-500 text-black font-black uppercase tracking-wider text-xs md:text-sm rounded-lg shadow-lg rotate-[-5deg] whitespace-nowrap">
                                            Matched
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {/* PHASE 4: Savings - Celebration */}
                            {phase === 4 && (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-accent-green/20 blur-[100px] -z-10" />
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-center"
                                    >
                                        <h3 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl">
                                            40%
                                        </h3>
                                        <p className="text-2xl text-accent-green font-bold tracking-widest uppercase mt-2">Savings Unlocked</p>
                                    </motion.div>

                                    {/* Floating Coins */}
                                    {coinAnimations.map((coin, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute text-2xl"
                                            initial={{ opacity: 0, y: 0 }}
                                            animate={{ opacity: [0, 1, 0], y: -100, x: coin.x }}
                                            transition={{ duration: 2, delay: coin.delay, repeat: Infinity }}
                                            style={{ left: "50%", top: "50%" }}
                                        >
                                            💰
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* Timeline / Progress Bar */}
                    <div className="absolute bottom-0 left-0 w-full flex justify-center gap-2">
                        {phases.map((_, i) => (
                            <motion.div
                                key={i}
                                className={`h-1 rounded-full transition-all duration-300 ${i === phase ? "w-16 bg-white" : "w-4 bg-white/20"}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Text Overlay - Cinematic Subtitles */}
                <div className="max-w-3xl mx-auto text-center mt-12 h-32 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={phase}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <h3 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${phases[phase].color} bg-clip-text text-transparent mb-3`}>
                                {phases[phase].title}
                            </h3>
                            <p className="text-lg text-gray-400 font-light leading-relaxed">
                                {phases[phase].desc}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
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

            {/* NEW Story Flow */}
            <StoryFlow />
        </div>
    );
};

export default HowItWorksPage;
