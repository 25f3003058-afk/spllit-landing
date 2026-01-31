import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaSignOutAlt, FaCar, FaMapMarkerAlt } from 'react-icons/fa';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isAuthenticated || !user) {
            navigate('/login');
            return;
        }

        // Connect to Socket.IO for real-time features
        socketService.connect(user.id);

        // Cleanup on unmount
        return () => {
            socketService.disconnect();
        };
    }, [isAuthenticated, user, navigate]);

    const handleLogout = () => {
        socketService.disconnect();
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] overflow-hidden relative font-poppins">
            {/* Background */}
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

            <div className="container mx-auto px-6 pt-20 pb-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                            Welcome to <span className="text-accent-green">Spllit</span>
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Your smart ride-matching dashboard is ready!
                        </p>
                    </div>

                    {/* User Profile Card */}
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-bg-secondary border border-white/10 rounded-3xl p-8 mb-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-accent-green/20 border-2 border-accent-green rounded-2xl flex items-center justify-center">
                                    <FaUser className="text-accent-green text-3xl" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                                    <p className="text-gray-500 text-sm">{user.college || 'IIT Madras BS Degree'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2 font-medium"
                            >
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <FaEnvelope className="text-accent-green" />
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Email</span>
                                </div>
                                <p className="text-white font-medium">{user.email}</p>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <FaPhone className="text-accent-green" />
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Phone</span>
                                </div>
                                <p className="text-white font-medium">{user.phone || 'Not provided'}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Create Ride Card */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-bg-secondary border border-white/10 rounded-3xl p-8 cursor-pointer hover:border-accent-green/30 transition-all group"
                        >
                            <div className="w-16 h-16 bg-accent-green/20 border-2 border-accent-green rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FaCar className="text-accent-green text-2xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Create Ride</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Post your ride request and find students going to the same exam center within 30 minutes.
                            </p>
                            <div className="mt-6 text-accent-green font-bold text-sm uppercase tracking-wider">
                                Coming Soon →
                            </div>
                        </motion.div>

                        {/* Find Matches Card */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-bg-secondary border border-white/10 rounded-3xl p-8 cursor-pointer hover:border-accent-green/30 transition-all group"
                        >
                            <div className="w-16 h-16 bg-purple-500/20 border-2 border-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FaMapMarkerAlt className="text-purple-500 text-2xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Find Matches</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Browse available rides and connect with verified students for safe group travel.
                            </p>
                            <div className="mt-6 text-accent-green font-bold text-sm uppercase tracking-wider">
                                Coming Soon →
                            </div>
                        </motion.div>
                    </div>

                    {/* Success Message */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 bg-accent-green/10 border border-accent-green/20 rounded-2xl p-6 text-center"
                    >
                        <p className="text-accent-green font-bold text-lg">
                            🎉 Backend Integration Complete!
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Your login is now connected to the backend API. Socket.IO real-time features are ready!
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
