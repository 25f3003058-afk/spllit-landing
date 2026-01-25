import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// High-Fidelity Cyber Artifacts
const Artifact = ({ type, active, result }) => {
    const variants = {
        idle: { scale: 1, rotate: 0 },
        active: { scale: 1.1, filter: "drop-shadow(0 0 15px #10b981)" },
        won: { scale: [1, 1.3, 1], filter: ["drop-shadow(0 0 10px #10b981)", "drop-shadow(0 0 40px #10b981)", "drop-shadow(0 0 10px #10b981)"] }
    };

    if (type === 'rock') return (
        <motion.svg viewBox="0 0 100 100" className="w-full h-full" animate={result === 'won' ? "won" : active ? "active" : "idle"} variants={variants}>
            <defs>
                <linearGradient id="stone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#064e3b" />
                </linearGradient>
            </defs>
            <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" fill="url(#stone-grad)" fillOpacity="0.2" stroke="#10b981" strokeWidth="2" />
            <path d="M50 20 L80 35 L50 50 L20 35 Z" fill="#10b981" fillOpacity="0.8" />
            <path d="M80 35 L80 65 L50 80 L50 50 Z" fill="#10b981" fillOpacity="0.4" />
            <path d="M20 35 L50 50 L50 80 L20 65 Z" fill="#10b981" fillOpacity="0.2" />
            <motion.path
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                d="M50 10 L50 90 M10 30 L90 70 M90 30 L10 70"
                stroke="#10b981" strokeWidth="0.5" strokeDasharray="2 2"
            />
        </motion.svg>
    );

    if (type === 'paper') return (
        <motion.svg viewBox="0 0 100 100" className="w-full h-full" animate={result === 'won' ? "won" : active ? "active" : "idle"} variants={variants}>
            <rect x="25" y="15" width="50" height="70" rx="4" stroke="#10b981" strokeWidth="2" fill="none" />
            <motion.rect
                animate={{ height: [0, 70, 0], y: [15, 15, 85] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                x="25" y="15" width="50" height="2" fill="#10b981"
            />
            {[1, 2, 3, 4, 5].map(i => (
                <line key={i} x1="32" y1={25 + i * 10} x2="68" y2={25 + i * 10} stroke="#10b981" strokeWidth="1" strokeOpacity="0.3" />
            ))}
            <circle cx="50" cy="50" r="10" stroke="#10b981" strokeWidth="1" fill="none" strokeDasharray="4 2" />
        </motion.svg>
    );

    if (type === 'scissors') return (
        <motion.svg viewBox="0 0 100 100" className="w-full h-full" animate={result === 'won' ? "won" : active ? "active" : "idle"} variants={variants}>
            <motion.circle
                animate={{ r: [15, 20, 15], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                cx="50" cy="50" r="15" stroke="#10b981" strokeWidth="1" fill="none"
            />
            <path d="M30 30 L70 70 M70 30 L30 70" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <path d="M50 10 L50 90" stroke="#10b981" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" />
            <path d="M10 50 L90 50" stroke="#10b981" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" />
            <circle cx="50" cy="50" r="5" fill="#10b981" />
        </motion.svg>
    );
};

const RockPaperScissors = ({ onGameComplete }) => {
    const [gameState, setGameState] = useState('waiting');
    const [userChoice, setUserChoice] = useState(null);
    const [computerChoice, setComputerChoice] = useState(null);
    const [battleResult, setBattleResult] = useState(null);

    const choices = [
        { id: 'rock', label: 'STONE', hue: '160' },
        { id: 'paper', label: 'PAPER', hue: '140' },
        { id: 'scissors', label: 'THREAD', hue: '180' }
    ];

    const handleChoice = (id) => {
        setUserChoice(id);
        setGameState('shaking');

        // Logic: Guaranteed win for elite onboarding experience (98% win)
        // eslint-disable-next-line react-hooks/purity
        const isWin = Math.random() < 0.98;
        let comp;
        if (isWin) {
            comp = id === 'rock' ? 'scissors' : id === 'paper' ? 'rock' : 'paper';
        } else {
            comp = id; // Draw if not a win
        }
        setComputerChoice(comp);

        setTimeout(() => {
            setGameState('result');
            setBattleResult(isWin ? 'won' : 'draw');
            if (isWin) {
                setTimeout(() => onGameComplete(true), 1200);
            } else {
                setTimeout(() => {
                    setGameState('waiting');
                    setUserChoice(null);
                    setComputerChoice(null);
                }, 800);
            }
        }, 1200);
    };

    return (
        <div className="relative w-full py-8 select-none">
            <AnimatePresence mode="wait">
                {gameState === 'waiting' && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="grid grid-cols-3 gap-4"
                    >
                        {choices.map((choice) => (
                            <motion.div
                                key={choice.id}
                                whileHover={{ y: -8 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleChoice(choice.id)}
                                className="group relative cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-accent-green/5 blur-2xl group-hover:bg-accent-green/20 transition-all rounded-full" />
                                <div className="relative aspect-[4/5] bg-black/40 border border-white/5 group-hover:border-accent-green/50 rounded-2xl flex flex-col items-center justify-between p-4 overflow-hidden shadow-2xl transition-all">
                                    {/* Glass reflection */}
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                                    <div className="w-full h-24 flex items-center justify-center">
                                        <Artifact type={choice.id} active={true} />
                                    </div>

                                    <div className="text-[10px] font-black tracking-[0.3em] text-accent-green/60 group-hover:text-accent-green transition-colors uppercase">
                                        {choice.label}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {gameState === 'shaking' && (
                    <motion.div
                        key="battle-phase"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative h-64 w-full flex items-center justify-center overflow-hidden rounded-3xl border border-white/5 bg-black/60"
                    >
                        {/* Scanning Line */}
                        <motion.div
                            animate={{ left: ['0%', '100%'] }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="absolute top-0 w-[2px] h-full bg-accent-green shadow-[0_0_15px_#10b981] z-20"
                        />

                        {/* Battle Grid */}
                        <div className="absolute inset-0 bg-[radial-gradient(#10b98111_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />

                        <div className="flex items-center gap-16 md:gap-24 relative z-10">
                            <motion.div
                                animate={{ y: [-15, 15], scale: [1, 1.05] }}
                                transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse" }}
                                className="w-24 h-24"
                            >
                                <Artifact type="rock" active={false} />
                            </motion.div>

                            <div className="flex flex-col items-center">
                                <span className="text-xl font-black text-white italic tracking-tighter opacity-20">VS</span>
                                <motion.div
                                    animate={{ height: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-px bg-accent-green/20 h-20"
                                />
                            </div>

                            <motion.div
                                animate={{ y: [15, -15], scale: [1.05, 1] }}
                                transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse" }}
                                className="w-24 h-24 rotate-180 grayscale opacity-40"
                            >
                                <Artifact type="rock" active={false} />
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {gameState === 'result' && (
                    <motion.div
                        key="outcome"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative space-y-8"
                    >
                        <div className="flex items-center justify-between px-8 relative">
                            {/* Connection Link */}
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-accent-green via-white to-red-500/20 origin-left"
                            />

                            <div className="flex flex-col items-center gap-4 relative z-10">
                                <span className="text-[10px] font-bold text-accent-green tracking-widest">USER RESULT</span>
                                <div className="w-32 h-32 p-4 bg-accent-green/5 border border-accent-green/20 rounded-full">
                                    <Artifact type={userChoice} result={battleResult} />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4 relative z-10">
                                <span className="text-[10px] font-bold text-red-500 tracking-widest">AI REACTION</span>
                                <div className="w-32 h-32 p-4 bg-red-500/5 border border-red-500/20 rounded-full opacity-60">
                                    <Artifact type={computerChoice} active={false} />
                                </div>
                            </div>
                        </div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-center"
                        >
                            <h3 className="text-2xl font-black text-white italic tracking-[0.2em] mb-2">
                                {battleResult === 'won' ? 'DISCOUNT OVERDRIVE ACTIVATED' : 'DATA SYNC FAILED'}
                            </h3>
                            <div className="w-48 h-1 bg-white/5 mx-auto rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-accent-green"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RockPaperScissors;
