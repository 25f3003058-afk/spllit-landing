import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaWhatsapp, FaTelegram, FaMapMarkerAlt, FaUserFriends, FaMobileAlt } from 'react-icons/fa';

const PhoneMockup = () => {
    return (
        <div className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>

            {/* Screen Content */}
            <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black relative flex flex-col items-center justify-center p-6">

                {/* Floating Logo */}
                <motion.div
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 bg-accent-green rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                >
                    <span className="text-4xl font-black text-black">S</span>
                </motion.div>

                {/* App Text */}
                <h3 className="text-2xl font-bold text-white mb-2">Spllit</h3>
                <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20 mb-8">
                    <span className="text-xs text-accent-green font-mono uppercase tracking-widest">Beta Access</span>
                </div>

                {/* Mock UI Elements */}
                <div className="w-full space-y-3 opacity-50">
                    <div className="h-12 bg-gray-800 rounded-xl w-full animate-pulse"></div>
                    <div className="h-32 bg-gray-800 rounded-xl w-full animate-pulse"></div>
                    <div className="flex gap-3">
                        <div className="h-20 bg-gray-800 rounded-xl w-1/2 animate-pulse"></div>
                        <div className="h-20 bg-gray-800 rounded-xl w-1/2 animate-pulse"></div>
                    </div>
                </div>

                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center p-6 border border-white/10 bg-black/80 rounded-2xl mx-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <p className="text-accent-green font-bold text-xl mb-1">COMING SOON</p>
                        <p className="text-gray-400 text-sm">To Your Pocket</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Featurepill = ({ icon, text }) => (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-gray-300 text-sm">
        <span className="text-accent-green">{icon}</span>
        <span>{text}</span>
    </div>
);

const Login = () => {
    return (
        <div className="min-h-screen bg-bg-primary overflow-hidden relative flex flex-col lg:flex-row">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-green/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            {/* Back Button */}
            <Link to="/" className="absolute top-8 left-8 z-30 flex items-center gap-2 text-text-secondary hover:text-white transition-colors group">
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Home</span>
            </Link>

            {/* Left Content Section */}
            <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 pt-24 pb-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-xl"
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                        IIT Madras BS Exclusive
                    </div>

                    <h1 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight">
                        Struggling to find an <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-400">
                            Exam Center Partner?
                        </span>
                    </h1>

                    <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                        Join the tailored community for IITM BS students. Connect with batchmates traveling to the same center, save costs, and never travel alone again.
                    </p>

                    <div className="flex flex-wrap gap-4 mb-10">
                        <Featurepill icon={<FaMapMarkerAlt />} text="Same Center Matching" />
                        <Featurepill icon={<FaUserFriends />} text="Verified Students" />
                        <Featurepill icon={<FaMobileAlt />} text="Split Costs Instantly" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button className="px-8 py-4 bg-accent-green text-black font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                            <span>Join Waitlist</span>
                            <span className="bg-black/20 px-2 py-0.5 rounded text-xs">#EarlyAccess</span>
                        </button>

                        <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-3">
                            <FaWhatsapp className="text-xl text-green-400" />
                            <span>Join Community</span>
                        </button>
                    </div>

                    <div className="mt-8 flex items-center gap-4 text-xs text-gray-500 font-mono">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            400+ Students Waiting
                        </span>
                        <span>•</span>
                        <span>Launching this Semester</span>
                    </div>
                </motion.div>
            </div>

            {/* Right Visual Section */}
            <div className="flex-1 flex items-center justify-center relative min-h-[500px] lg:min-h-auto bg-gradient-to-b from-transparent to-black/20">
                {/* Abstract Shapes */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[600px] h-[600px] border border-white/5 rounded-full border-dashed"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[400px] h-[400px] border border-accent-green/10 rounded-full"
                />

                {/* Phone Mockup with floating animation */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <motion.div
                        animate={{ y: [-15, 15, -15] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <PhoneMockup />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
