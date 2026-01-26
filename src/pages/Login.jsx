import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaWhatsapp, FaUniversity, FaSearchLocation, FaUserCheck, FaBell, FaGraduationCap } from 'react-icons/fa';

// --- Premium Phone Mockup with "Live Match" Simulation ---
const PhoneMockup = () => {
    // Automate a "notification" popping up
    const [showNotif, setShowNotif] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setShowNotif(true);
            setTimeout(() => setShowNotif(false), 4000);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-[320px] h-[640px] bg-[#0a0a0a] rounded-[3.5rem] border-[8px] border-[#1a1a1a] shadow-2xl overflow-hidden ring-4 ring-white/5">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-full z-30 flex items-center justify-center p-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-auto mr-2" />
            </div>

            {/* Screen Content */}
            <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black relative flex flex-col p-6 pt-16">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h4 className="text-white font-bold text-lg">Hello, Ankit 👋</h4>
                        <p className="text-xs text-gray-500">BS Degree • Year 2</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
                    </div>
                </div>

                {/* Main Card: "Searching" */}
                <div className="bg-gray-800/50 rounded-3xl p-6 border border-white/5 mb-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-accent-green/5 group-hover:bg-accent-green/10 transition-colors" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                            <FaSearchLocation className="text-xl" />
                        </div>
                        <span className="text-xs font-mono text-gray-400 bg-black/40 px-2 py-1 rounded">SCANNING</span>
                    </div>
                    <h5 className="text-gray-200 font-bold">Exam Center Search</h5>
                    <p className="text-xs text-gray-500 mt-1">Finding students near T. Nagar...</p>

                    {/* Radar Animation */}
                    <div className="mt-6 flex justify-center py-4 relative">
                        <div className="w-20 h-20 border border-white/10 rounded-full animate-ping absolute" />
                        <div className="w-10 h-10 bg-accent-green rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] z-10" />
                        <div className="absolute -right-2 top-0 w-6 h-6 bg-purple-500 rounded-full border-2 border-gray-900 animate-bounce" />
                    </div>
                </div>

                {/* "Live Notification" Popup */}
                <AnimatePresence>
                    {showNotif && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="absolute top-14 left-4 right-4 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl z-20 shadow-xl flex gap-3"
                        >
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-black">
                                <FaUserCheck />
                            </div>
                            <div>
                                <h6 className="text-white font-bold text-sm">Match Found!</h6>
                                <p className="text-xs text-gray-300">Rahul is going to Ion Digital Zone.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Navigation Mock */}
                <div className="mt-auto flex justify-between px-4 py-4 text-2xl text-gray-600">
                    <div className="text-accent-green"><FaUniversity /></div>
                    <div><FaSearchLocation /></div>
                    <div><FaBell /></div>
                </div>
            </div>
        </div>
    );
};

// --- Scrolling Pain Points Ticker ---
const PainPointTicker = () => (
    <div className="w-full overflow-hidden bg-white/5 border-y border-white/5 py-3 mb-12">
        <motion.div
            className="flex whitespace-nowrap gap-8"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
            {[
                "🚕 Cab fare ₹800? Split it.",
                "😓 Traveling alone is boring.",
                "📍 Exam center 20km away?",
                "🤝 Meet your batchmates.",
                "💸 Save 60% on travel.",
                "🚕 Cab fare ₹800? Split it.",
                "😓 Traveling alone is boring.",
                "📍 Exam center 20km away?",
            ].map((text, i) => (
                <span key={i} className="text-gray-400 font-mono text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-1 bg-accent-green rounded-full" /> {text}
                </span>
            ))}
        </motion.div>
    </div>
);

const Login = () => {
    // Stats Counter Animation
    const [count, setCount] = useState(0);
    useEffect(() => {
        const controls = setInterval(() => {
            setCount(prev => prev < 427 ? prev + 3 : 427);
        }, 10);
        return () => clearInterval(controls);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] overflow-hidden relative font-poppins selection:bg-accent-green selection:text-black">

            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="absolute inset-0 z-0 opacity-30">
                <svg className="w-full h-full" width="100%" height="100%">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>



            <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-20">

                    {/* Left: Content */}
                    <div className="flex-1 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* TARGET AUDIENCE BADGE - EMPHASIZED */}
                            <div className="inline-block mb-6">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="px-3 md:px-6 py-1.5 md:py-2 bg-gradient-to-r from-red-600 to-red-900 rounded-full border border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-2 md:gap-3"
                                >
                                    <FaGraduationCap className="text-white text-base md:text-xl" />
                                    <span className="text-white font-bold tracking-wide uppercase text-[10px] md:text-sm">
                                        Exclusively for IIT Madras BS Students
                                    </span>
                                </motion.div>
                            </div>

                            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-[1.2] lg:leading-[1.1] tracking-tight">
                                Don't Travel to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green via-emerald-400 to-teal-500">
                                    Exam Centers
                                </span> Alone.
                            </h1>

                            <p className="text-gray-400 text-sm md:text-lg lg:text-xl mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed px-2 sm:px-0">
                                Connect with verified batchmates going to the same Ion Digital Zone. Split the cab fare, share notes, and make the journey count.
                            </p>

                            <PainPointTicker />

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-center lg:justify-start w-full sm:w-auto">
                                <button className="px-8 py-4 bg-white text-black font-extrabold rounded-2xl hover:bg-gray-200 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.05)] flex items-center justify-center gap-2">
                                    Join the Waitlist
                                </button>

                                <a
                                    href="https://chat.whatsapp.com/H49JywLfKsxAoC8X5wC0yg"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-4 bg-[#25D366] text-black font-extrabold rounded-2xl hover:bg-[#20bd5a] hover:scale-[1.02] transition-all shadow-[0_20px_40px_rgba(37,211,102,0.15)] flex items-center justify-center gap-2"
                                >
                                    <FaWhatsapp size={20} />
                                    Join Community Group
                                </a>
                            </div>

                            <div className="mt-12 flex items-center justify-center lg:justify-start gap-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="student" />
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-black bg-accent-green flex items-center justify-center text-black font-bold text-xs">
                                        +420
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-bold text-lg leading-none">{count}+</p>
                                    <p className="text-gray-500 text-xs">BS Students Joined</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Interactive Component */}
                    <div className="flex-1 flex justify-center relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            {/* Glow Effects behind phone */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-green/20 rounded-full blur-[120px] pointer-events-none" />

                            <PhoneMockup />

                            {/* Floating Badge */}
                            <motion.div
                                animate={{ y: [-10, 10, -10] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-10 -right-10 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl max-w-[200px]"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <FaUniversity className="text-yellow-500" />
                                    <span className="text-xs font-bold text-white">IIT Madras Verified</span>
                                </div>
                                <p className="text-[10px] text-gray-400">Exclusive network for BS Degree students.</p>
                            </motion.div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
