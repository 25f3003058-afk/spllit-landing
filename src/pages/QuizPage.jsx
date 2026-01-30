import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaMapMarkerAlt, FaUserFriends, FaCalendarAlt, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import SEO from '../components/SEO';

const CHENNAI_CENTERS = [
    "iON Digital Zone iDZ T Nagar (Ramakrishna Mission)",
    "iON Digital Zone iDZ Ambattur (Indira Memorial)",
    "iON Digital Zone iDZ Kovilambakkam",
    "iON Digital Zone iDZ Kundrathur",
    "iON Digital Zone iDZ Padi",
    "iON Digital Zone iDZ Perungudi",
    "iON Digital Zone iDZ Thoraipakkam",
    "iON Digital Zone iDZ Pallavaram",
    "iON Digital Zone iDZ Maduravoyal"
];

const QuizPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        level: '',
        centerName: '',
        state: 'Tamil Nadu',
        city: 'Chennai',
        genderPreference: '',
        date: '15 March 2026'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Get previous user data from location state
    const userData = location.state?.userData || {};

    useEffect(() => {
        if (!userData.name) {
            // If no user data, redirect back to login
            navigate('/login');
        }
    }, [userData, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const fullData = {
            ...userData,
            ...formData,
            timestamp: new Date().toISOString()
        };

        try {
            // PASTE YOUR GOOGLE APPS SCRIPT URL HERE
            const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDMPnq0OzTRVEh7B_TpsEU_A8IQ4jWOmcmfcW7bpKcGIC_3wBd6S5O7NYRW0H77CTLbw/exec';

            const dataToSubmit = {
                name: userData.name,
                college: userData.college,
                degree: userData.degree,
                email: userData.email,
                phone: userData.phone,
                level: formData.level,
                centerName: formData.centerName,
                genderPreference: formData.genderPreference,
                timestamp: new Date().toISOString()
            };

            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(dataToSubmit)
            });

            setIsSuccess(true);


            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-6 relative overflow-hidden selection:bg-accent-green selection:text-black">
            <SEO title="Quiz 1 - 15 March 2026 | Spllit" description="Connect with batchmates for Quiz 1 at IIT Madras BS Degree centers." />

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent-green/10 rounded-full blur-[120px]" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />

            <div className="container mx-auto max-w-2xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-accent-green font-mono text-sm tracking-widest uppercase mb-2">Quiz 1 Support</h2>
                            <h1 className="text-4xl font-black mb-2">15 March 2026</h1>
                            <p className="text-gray-400">Final Step: Choose your exam center and preferences.</p>
                        </div>
                        <div className="p-4 bg-accent-green/10 rounded-2xl text-accent-green border border-accent-green/20">
                            <FaCalendarAlt size={24} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <label className="text-sm font-semibold text-gray-300 ml-1">Current Level of Study</label>
                        <select
                            required
                            value={formData.level}
                            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-accent-green outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="" disabled className="bg-[#0a0a0a]">Select Level</option>
                            <option value="Level 1" className="bg-[#0a0a0a]">Level 1 (Direct Entry / Sem 1)</option>
                            <option value="Level 2" className="bg-[#0a0a0a]">Level 2 (Sem 2/3)</option>
                            <option value="Level 3" className="bg-[#0a0a0a]">Level 3 (Advanced)</option>
                        </select>


                        {/* Center Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Exam Center (Chennai)</label>
                            <div className="relative">
                                <select
                                    required
                                    value={formData.centerName}
                                    onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-accent-green outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="bg-[#0a0a0a]">Select Center</option>
                                    {CHENNAI_CENTERS.map((center, idx) => (
                                        <option key={idx} value={center} className="bg-[#0a0a0a]">{center}</option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <FaMapMarkerAlt />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* State */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-300 ml-1">State</label>
                                <input
                                    readOnly
                                    value={formData.state}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            {/* City */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-300 ml-1">City</label>
                                <input
                                    readOnly
                                    value={formData.city}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Gender Preference */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Gender Preference for Shared Ride</label>
                            <select
                                required
                                value={formData.genderPreference}
                                onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-accent-green outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="" disabled className="bg-[#0a0a0a]">Select Preference</option>
                                <option value="Any" className="bg-[#0a0a0a]">Any (No Preference)</option>
                                <option value="Same Gender" className="bg-[#0a0a0a]">Same Gender Only</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || isSuccess}
                            className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${isSuccess
                                ? 'bg-green-500 text-white'
                                : 'bg-gradient-to-r from-accent-green to-emerald-500 text-black hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-1 active:scale-95'
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                            ) : isSuccess ? (
                                <>Success <FaCheckCircle /></>
                            ) : (
                                <>Get Connected <FaArrowRight /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-4 py-4 px-6 bg-white/5 rounded-2xl border border-white/5 text-gray-500 text-xs">
                        <FaUserFriends />
                        <span>Matching you with 10+ students in your area</span>
                    </div>
                </motion.div>
            </div>

            {/* Success Overlay */}
            <AnimatePresence>
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
                    >
                        <div className="text-center p-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 10 }}
                                className="w-24 h-24 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-6 text-black border-8 border-accent-green/20"
                            >
                                <FaCheckCircle size={40} />
                            </motion.div>
                            <h2 className="text-4xl font-black mb-4">Request Received!</h2>
                            <p className="text-gray-400 max-w-md mx-auto">
                                Your details have been added to our database. We will notify you once we find the perfect ride match for your Quiz 1 journey.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuizPage;
