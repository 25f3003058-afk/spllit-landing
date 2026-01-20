import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaGoogle, FaUser, FaPhone } from 'react-icons/fa';
import confetti from 'canvas-confetti';
import RockPaperScissors from './RockPaperScissors';

const SignupModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: Game, 2: Form, 3: Success
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [wonDiscount, setWonDiscount] = useState(false);

    const handleGameComplete = (won) => {
        setWonDiscount(won);
        setTimeout(() => {
            setStep(2);
        }, 1000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Google Apps Script Web App URL
            const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwNXRKhrj23sSJw2tbBiRT-PiY8BXbGNMXEq0ZGEQRbGxnl97W_wOnxtM4B4NEw53as/exec';

            // Send data using no-cors mode to avoid CORS issues with Google Apps Script
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    ...formData,
                    timestamp: new Date().toISOString(),
                    discountWon: wonDiscount
                })
            });

            // Since no-cors doesn't return a readable response, we assume success if no error was thrown
            setStep(3);
            triggerCelebration();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const triggerCelebration = () => {
        const duration = 5000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 7,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#10b981', '#34d399', '#ffffff']
            });
            confetti({
                particleCount: 7,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#10b981', '#34d399', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <FaTimes />
                        </button>

                        <div className="p-8 text-center">
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Play to Win!</h2>
                                    <p className="text-gray-500 mb-6">Beat the AI to unlock 80% OFF your first ride.</p>
                                    <RockPaperScissors onGameComplete={handleGameComplete} />
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                        {wonDiscount ? 'Claim Your 80% OFF!' : 'Join the Waitlist'}
                                    </h2>
                                    <p className="text-gray-500 mb-6">
                                        {wonDiscount ? 'Fill the form to lock in your discount.' : 'Don\'t worry, you still get early access!'}
                                    </p>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="relative">
                                            <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                required
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-green/50 text-gray-800"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative">
                                            <FaGoogle className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                placeholder="Gmail Address"
                                                required
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-green/50 text-gray-800"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative">
                                            <FaPhone className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                placeholder="Phone Number"
                                                required
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-green/50 text-gray-800"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-accent-green to-accent-emerald text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Processing...' : 'Get Started'}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-10"
                                >
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <span className="text-4xl">🎉</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome Aboard!</h2>
                                    <p className="text-gray-600">
                                        {wonDiscount ? 'Your 80% discount has been saved.' : 'You\'ve successfully joined the waitlist.'}
                                    </p>
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
