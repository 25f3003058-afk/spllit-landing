import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaGoogle, FaUser, FaPhone, FaShieldAlt } from 'react-icons/fa';
import confetti from 'canvas-confetti';
import CarbonAnimation from './CarbonAnimation';

const countryCodes = [
    { code: "+91", name: "India" },
    { code: "+1", name: "USA/Canada" },
    { code: "+44", name: "UK" },
    { code: "+61", name: "Australia" },
    { code: "+81", name: "Japan" },
    { code: "+49", name: "Germany" },
    { code: "+33", name: "France" },
    { code: "+971", name: "UAE" },
    { code: "+65", name: "Singapore" },
    { code: "+86", name: "China" },
    { code: "+7", name: "Russia" },
    { code: "+55", name: "Brazil" },
    { code: "+27", name: "South Africa" },
    { code: "+82", name: "South Korea" },
    { code: "+39", name: "Italy" },
    { code: "+34", name: "Spain" },
    { code: "+41", name: "Switzerland" },
    { code: "+31", name: "Netherlands" },
    { code: "+46", name: "Sweden" },
    { code: "+47", name: "Norway" },
    { code: "+45", name: "Denmark" },
    { code: "+358", name: "Finland" },
    { code: "+353", name: "Ireland" },
    { code: "+64", name: "New Zealand" },
    { code: "+60", name: "Malaysia" },
    { code: "+66", name: "Thailand" },
    { code: "+62", name: "Indonesia" },
    { code: "+63", name: "Philippines" },
    { code: "+84", name: "Vietnam" },
    { code: "+90", name: "Turkey" },
    { code: "+966", name: "Saudi Arabia" },
    { code: "+20", name: "Egypt" },
    { code: "+234", name: "Nigeria" },
    { code: "+254", name: "Kenya" },
    { code: "+52", name: "Mexico" },
    { code: "+54", name: "Argentina" },
    { code: "+56", name: "Chile" },
    { code: "+57", name: "Colombia" },
    { code: "+92", name: "Pakistan" },
    { code: "+880", name: "Bangladesh" },
    { code: "+94", name: "Sri Lanka" },
    { code: "+977", name: "Nepal" }
].sort((a, b) => a.code === "+91" ? -1 : b.code === "+91" ? 1 : a.name.localeCompare(b.name));

const SignupModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        college: 'IIT Madras (BS Degree)',
        email: '',
        phone: ''
    });
    const [emailId, setEmailId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [wonDiscount, setWonDiscount] = useState(false);

    const handleGameComplete = (won) => {
        setWonDiscount(won);
        setTimeout(() => {
            setStep(2);
        }, 300);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw3pNQpPrsNkl2c3omWQhqgdv98-sh70lvn3be2w4MIsEqeuJw003xsokpTpgRfTxdm_Q/exec';
            const submissionData = {
                ...formData,
                email: `${emailId}@study.iitm.ac.in`,
                fullPhone: `+91 ${phoneNumber}`,
                timestamp: new Date().toISOString(),
                discountWon: wonDiscount
            };

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(submissionData)
            });

            setStep(3);
            triggerCelebration();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Authentication Error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const triggerCelebration = () => {
        const count = 200;
        const defaults = { origin: { y: 0.7 }, zIndex: 1000 };
        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
                colors: ['#10b981', '#34d399', '#ffffff']
            });
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
                    />

                    {/* Ecological Leaf Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ top: '-10%', left: `${i * 15}%`, rotate: 0 }}
                                animate={{ top: '110%', rotate: 360, x: [0, 20, -20, 0] }}
                                transition={{ duration: 15 + i * 2, repeat: Infinity, ease: "linear", delay: i * 1 }}
                                className="absolute w-4 h-4 bg-accent-green/20 rounded-full blur-sm"
                            />
                        ))}
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -30 }}
                        className="relative w-full max-w-lg bg-bg-secondary border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(16,185,129,0.1)] overflow-hidden"
                    >
                        {/* Dynamic Progress Bar */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5">
                            <motion.div
                                className="h-full bg-gradient-to-r from-accent-green to-accent-emerald shadow-[0_0_20px_#10b981]"
                                animate={{ width: `${(step / 3) * 100}%` }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            />
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 z-20 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all border border-white/5 hover:border-accent-green/30"
                        >
                            <FaTimes />
                        </button>

                        <div className="p-8 md:p-12">
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                                    className="text-center"
                                >
                                    <div className="inline-block px-4 py-1 rounded-full border border-accent-green/20 bg-accent-green/5 mb-6">
                                        <span className="text-[10px] font-black tracking-[0.4em] text-accent-green uppercase">Impact Phase</span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tighter">
                                        SPLIT & <span className="text-accent-green">SAVE</span>
                                    </h2>
                                    <p className="text-text-muted mb-4 text-xs tracking-widest leading-relaxed uppercase">Your journey towards a greener commute starts here</p>

                                    <div className="relative p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[2rem]">
                                        <div className="bg-bg-primary/80 backdrop-blur-md rounded-[1.9rem] shadow-2xl">
                                            <CarbonAnimation onComplete={() => handleGameComplete(true)} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="max-w-sm mx-auto text-center"
                                >
                                    <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-accent-green/20 blur-3xl rounded-full animate-pulse"></div>
                                        {/* Premium Bill Split Icon */}
                                        <div className="relative w-full h-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl flex items-center justify-center group overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-accent-green/20 via-accent-emerald/20 to-accent-lime/20 animate-gradient-slow opacity-50"></div>
                                            <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-xl overflow-visible">
                                                {/* Left Half (Green) */}
                                                <motion.path
                                                    d="M10 30 L50 30 L50 70 L10 70 Z"
                                                    fill="#10B981"
                                                    animate={{ x: [-2, 2, -2], y: [-1, 1, -1] }}
                                                    transition={{ duration: 3, repeat: Infinity }}
                                                />
                                                {/* Right Half (Orange) */}
                                                <motion.path
                                                    d="M50 30 L90 30 L90 70 L50 70 Z"
                                                    fill="#F59E0B"
                                                    animate={{ x: [2, -2, 2], y: [1, -1, 1] }}
                                                    transition={{ duration: 3, repeat: Infinity }}
                                                />
                                                {/* Split Line */}
                                                <rect x="49" y="25" width="2" height="50" fill="white" fillOpacity="0.5" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">
                                        SIGN UP <span className="text-accent-green">NOW</span>
                                    </h2>
                                    <p className="text-text-muted mb-10 text-[10px] tracking-[0.4em] uppercase leading-relaxed font-poppins font-black">
                                        JOIN THE 1% SAVING CARBON
                                    </p>

                                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-accent-green ml-4 tracking-widest uppercase">NAME</label>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    placeholder="YOUR NAME"
                                                    required
                                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-accent-green/50 text-white placeholder-gray-700 font-poppins text-xs transition-all"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-accent-green ml-4 tracking-widest uppercase">Official Student Email</label>
                                            <div className="relative flex items-center">
                                                <div className="relative flex-1">
                                                    <input
                                                        required
                                                        type="text"
                                                        placeholder="Roll No (e.g. 25f36563058)"
                                                        value={emailId}
                                                        onChange={(e) => setEmailId(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-l-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-accent-green/50 text-white placeholder-gray-700 font-poppins text-xs transition-all"
                                                    />
                                                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                                                </div>
                                                <div className="bg-white/10 border border-l-0 border-white/10 rounded-r-2xl px-4 py-4 text-gray-400 font-medium text-[10px] flex items-center">
                                                    study.iitm.ac.in
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-accent-green ml-4 tracking-widest uppercase">Phone Number</label>
                                            <div className="flex gap-2">
                                                <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-gray-300 font-black text-xs flex items-center">
                                                    +91
                                                </div>
                                                <div className="relative flex-1">
                                                    <input
                                                        required
                                                        type="tel"
                                                        maxLength="10"
                                                        placeholder="10 DIGITS"
                                                        value={phoneNumber}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            if (val.length <= 10) setPhoneNumber(val);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent-green/50 text-white placeholder-gray-700 font-poppins text-xs transition-all"
                                                    />
                                                </div>
                                            </div>
                                            {phoneNumber && phoneNumber.length < 10 && (
                                                <p className="text-[10px] text-red-500/60 ml-4 font-mono">Incomplete number</p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full mt-8 bg-accent-green text-black font-black py-5 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.2)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 tracking-[0.2em] uppercase"
                                        >
                                            {loading ? 'JOINING...' : 'JOIN WAITLIST'}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-12 text-center"
                                >
                                    <div className="relative w-32 h-32 mx-auto mb-10">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-2 border-dashed border-accent-green/30 rounded-full"
                                        />
                                        <div className="absolute inset-4 bg-accent-green/10 border border-accent-green/20 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)]">
                                            <svg className="w-12 h-12 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase">YOU'RE IN!</h2>
                                    <p className="text-text-muted font-poppins text-[11px] leading-relaxed max-w-xs mx-auto uppercase tracking-widest">
                                        You've successfully joined the Spllit revolution. Together, we're making mobility smart and sustainable.
                                    </p>

                                    <button
                                        onClick={onClose}
                                        className="mt-12 px-8 py-3 rounded-full border border-white/10 text-white text-[10px] font-black tracking-[0.4em] uppercase hover:bg-white/5 transition-all"
                                    >
                                        BACK TO HOME
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SignupModal;
