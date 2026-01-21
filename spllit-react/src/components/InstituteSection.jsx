import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGraduationCap, FaChevronRight, FaCheckCircle, FaUniversity, FaArrowLeft, FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';
import confetti from 'canvas-confetti';

const institutes = [
    { id: 'iitm', name: 'IIT Madras', type: 'IIT', color: '#1a365d' },
    { id: 'iitb', name: 'IIT Bombay', type: 'IIT', color: '#702459' },
    { id: 'iitd', name: 'IIT Delhi', type: 'IIT', color: '#1c4532' },
    { id: 'iitk', name: 'IIT Kanpur', type: 'IIT', color: '#744210' },
    { id: 'iitkgp', name: 'IIT Kharagpur', type: 'IIT', color: '#2c5282' },
    { id: 'iitg', name: 'IIT Guwahati', type: 'IIT', color: '#285e61' },
    { id: 'iith', name: 'IIT Hyderabad', type: 'IIT', color: '#44337a' },
    { id: 'iisc', name: 'IISc Bangalore', type: 'IISc', color: '#2d3748' },
    { id: 'nitt', name: 'NIT Trichy', type: 'NIT', color: '#c53030' },
    { id: 'nitk', name: 'NIT Surathkal', type: 'NIT', color: '#2b6cb0' },
    { id: 'nitw', name: 'NIT Warangal', type: 'NIT', color: '#2f855a' },
];

const programs = [
    'B.Tech',
    'M.Tech',
    'PhD',
    'BS in Data Science and Applications',
    'BS in Electronics System',
    'Dual Degree',
    'MBA',
    'MSc'
];

const departments = [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Biotechnology',
    'Physics',
    'Chemistry',
    'Mathematics',
    'Humanities'
];

const InstituteSection = () => {
    const [selectedInstitute, setSelectedInstitute] = useState(institutes[0]);
    const [detailStep, setDetailStep] = useState(1); // 1: Coming Soon, 2: Form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        degree: '',
        department: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleInstituteClick = (inst) => {
        setSelectedInstitute(inst);
        setDetailStep(1);
        setIsSubmitted(false);
    };

    const triggerCelebration = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx0KmFKiMXlHycqNliSbn_tBCcldTHAvehAVS90I1DCoBoJy6remGvm2rBR2Z72VIw/exec';

        try {
            // Sending redundant keys (both lowercase and uppercase) to ensure matching with Google Script
            const payload = {
                // Lowercase keys (standard)
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                timestamp: new Date().toISOString(),

                // Uppercase keys (matching your screenshot headers)
                Name: formData.name,
                Email: formData.email,
                Phone: formData.phone,
                Date: new Date().toISOString(),

                // New fields (matching your screenshot headers)
                institute: selectedInstitute.name,
                degree: formData.degree,
                department: formData.department,

                // Metadata
                type: 'Institute_Waitlist'
            };

            console.log('Sending data to Google Sheets:', payload);

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload)
            });

            setIsSubmitted(true);
            triggerCelebration();
        } catch (error) {
            console.error('Error submitting:', error);
            alert('Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-20 bg-bg-primary overflow-hidden">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Exclusive for Top Tier Institutes
                    </h2>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                        Special student pricing and features for India's premier institutions.
                    </p>
                </motion.div>

                {/* Institute Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
                    {institutes.map((inst) => (
                        <motion.button
                            key={inst.id}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleInstituteClick(inst)}
                            className={`p-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 ${selectedInstitute?.id === inst.id
                                ? 'bg-accent-green/10 border-accent-green shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                : 'bg-bg-secondary border-white/5 hover:border-white/20'
                                }`}
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl">
                                <FaUniversity className={selectedInstitute?.id === inst.id ? 'text-accent-green' : 'text-gray-400'} />
                            </div>
                            <span className={`font-bold text-sm text-center ${selectedInstitute?.id === inst.id ? 'text-white' : 'text-text-secondary'}`}>
                                {inst.name}
                            </span>
                        </motion.button>
                    ))}
                </div>

                {/* Detail View */}
                <div className="max-w-5xl mx-auto">
                    <AnimatePresence mode="wait">
                        {!isSubmitted ? (
                            <motion.div
                                key={selectedInstitute.id + detailStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4 }}
                                className="bg-bg-secondary rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden min-h-[600px] flex flex-col justify-center"
                            >
                                <div className="absolute top-0 right-0 w-96 h-96 bg-accent-green/5 blur-[100px] -z-10" />

                                {detailStep === 1 ? (
                                    <div className="flex flex-col md:flex-row items-center gap-12">
                                        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="w-64 h-64 mb-8 relative"
                                            >
                                                <div className="absolute inset-0 bg-accent-green/10 rounded-full blur-2xl animate-pulse" />
                                                <div className="relative z-10 w-full h-full bg-bg-card border border-white/10 rounded-3xl p-4 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
                                                    <FaGraduationCap className="text-8xl text-accent-green animate-bounce" />
                                                    <div className="absolute bottom-4 left-0 right-0 text-center">
                                                        <span className="text-xs font-bold text-accent-green tracking-[0.2em] uppercase">Coming Soon</span>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            <h3 className="text-3xl font-bold mb-4 text-white">
                                                Spllit @ <span className="text-accent-green">{selectedInstitute.name}</span>
                                            </h3>
                                            <p className="text-text-secondary text-lg mb-8">
                                                We're building something special for the {selectedInstitute.name} community.
                                            </p>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setDetailStep(2)}
                                                className="group px-10 py-5 bg-accent-green text-white font-bold rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all flex items-center gap-3"
                                            >
                                                Are you from {selectedInstitute.name}? <FaChevronRight />
                                            </motion.button>
                                        </div>

                                        <div className="w-full md:w-1/2 hidden md:block">
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { title: 'Student Discount', desc: 'Flat 50% off' },
                                                    { title: 'Campus Routes', desc: 'Optimized travel' },
                                                    { title: 'Peer Matching', desc: 'Ride with students' },
                                                    { title: 'Zero Fees', desc: 'No campus fees' }
                                                ].map((feat, i) => (
                                                    <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                                                        <h4 className="font-bold text-accent-green mb-2">{feat.title}</h4>
                                                        <p className="text-xs text-text-muted">{feat.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-2xl mx-auto w-full">
                                        <button
                                            onClick={() => setDetailStep(1)}
                                            className="flex items-center gap-2 text-text-muted hover:text-white mb-8 transition-colors"
                                        >
                                            <FaArrowLeft /> Back
                                        </button>

                                        <h3 className="text-3xl font-bold mb-2 text-white">Join the Priority List</h3>
                                        <p className="text-text-secondary mb-8">Early access for {selectedInstitute.name}.</p>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="relative">
                                                <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500" />
                                                <input
                                                    type="text"
                                                    placeholder="Full Name"
                                                    required
                                                    className="w-full pl-12 pr-4 py-4 bg-bg-primary border border-white/10 rounded-xl focus:border-accent-green outline-none text-white"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500" />
                                                    <input
                                                        type="email"
                                                        placeholder="Email Address"
                                                        required
                                                        className="w-full pl-12 pr-4 py-4 bg-bg-primary border border-white/10 rounded-xl focus:border-accent-green outline-none text-white"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <FaPhone className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500" />
                                                    <input
                                                        type="tel"
                                                        placeholder="Phone Number"
                                                        required
                                                        className="w-full pl-12 pr-4 py-4 bg-bg-primary border border-white/10 rounded-xl focus:border-accent-green outline-none text-white"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <select
                                                    required
                                                    className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-4 focus:border-accent-green outline-none text-white appearance-none"
                                                    value={formData.degree}
                                                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                                                >
                                                    <option value="">Select Degree</option>
                                                    {programs.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                                <select
                                                    required
                                                    className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-4 focus:border-accent-green outline-none text-white appearance-none"
                                                    value={formData.department}
                                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full py-5 bg-gradient-to-r from-accent-green to-accent-emerald text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'Submitting...' : 'Submit Interest'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="max-w-2xl mx-auto text-center py-16 bg-bg-secondary rounded-3xl border border-accent-green/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
                            >
                                <FaCheckCircle className="text-6xl text-accent-green mx-auto mb-8" />
                                <h3 className="text-4xl font-bold mb-4 text-white">You're on the list!</h3>
                                <p className="text-text-secondary text-xl mb-10 px-8">
                                    Thank you {formData.name}! We'll reach out to you at {formData.email} as soon as we launch at {selectedInstitute.name}.
                                </p>
                                <button
                                    onClick={() => {
                                        setIsSubmitted(false);
                                        setDetailStep(1);
                                        setFormData({ name: '', email: '', phone: '', degree: '', department: '' });
                                    }}
                                    className="px-8 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    Back to Institutes
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

export default InstituteSection;
