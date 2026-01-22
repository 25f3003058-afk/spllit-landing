import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaReceipt, FaWallet, FaLock, FaChartLine, FaCoins, FaBriefcase } from 'react-icons/fa';

const FeatureCard = ({ feature, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    const iconMap = {
        'bill': FaReceipt,
        'card': FaWallet,
        'lock': FaLock,
        'chart': FaChartLine,
        'coin': FaCoins,
        'cart': FaBriefcase
    };

    const Icon = iconMap[feature.type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative"
        >
            <div className="relative h-[450px] bg-gradient-to-br from-bg-card to-bg-secondary rounded-3xl border border-accent-green/10 overflow-hidden transition-all duration-500 hover:border-accent-green/30 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-green/5 via-transparent to-accent-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-accent-green/20 to-accent-emerald/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                {/* Icon Container */}
                <div className="relative flex items-center justify-center h-64 pt-12">
                    <motion.div
                        animate={{
                            y: isHovered ? -10 : 0,
                            scale: isHovered ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                    >
                        {/* Icon Glow */}
                        <div className="absolute inset-0 bg-accent-green/30 blur-3xl rounded-full scale-150" />

                        {/* Icon */}
                        <div className="relative w-32 h-32 flex items-center justify-center rounded-2xl bg-gradient-to-br from-accent-green/20 to-accent-emerald/20 border border-accent-green/30 backdrop-blur-sm">
                            <Icon className="text-6xl text-accent-green group-hover:text-accent-emerald transition-colors duration-300" />
                        </div>

                        {/* Floating Particles */}
                        {isHovered && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{ opacity: [0, 1, 0], y: -50 }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                                    className="absolute -top-4 -left-4 w-2 h-2 bg-accent-green rounded-full"
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{ opacity: [0, 1, 0], y: -50 }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                    className="absolute -top-4 -right-4 w-2 h-2 bg-accent-emerald rounded-full"
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{ opacity: [0, 1, 0], y: -50 }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                    className="absolute -bottom-4 left-1/2 w-2 h-2 bg-accent-lime rounded-full"
                                />
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Content */}
                <div className="relative px-8 pb-8 text-center">
                    {/* Tag */}
                    <motion.div
                        animate={{
                            scale: isHovered ? 1.05 : 1,
                        }}
                        className="inline-block mb-4"
                    >
                        <span className="text-sm font-black tracking-[0.2em] text-accent-green uppercase">
                            {feature.tag}
                        </span>
                    </motion.div>

                    {/* Title & Description */}
                    <motion.div
                        animate={{
                            y: isHovered ? -5 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        <h3 className="text-xl font-bold text-white mb-3 font-poppins">
                            {feature.title}
                        </h3>
                        <p className="text-text-secondary text-sm leading-relaxed font-poppins">
                            {feature.description}
                        </p>
                    </motion.div>

                    {/* Learn More Button */}
                    <motion.button
                        animate={{
                            opacity: isHovered ? 1 : 0,
                            y: isHovered ? 0 : 10,
                        }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 px-6 py-2 rounded-full border border-accent-green/30 text-accent-green text-sm font-bold hover:bg-accent-green hover:text-black transition-all"
                    >
                        Learn More →
                    </motion.button>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-green/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
        </motion.div>
    );
};

const features = [
    {
        type: 'bill',
        tag: 'SPLITTING',
        title: 'Automated Fare Splitting',
        description: 'Real-time calculation of each rider\'s share based on distance traveled. Zero manual calculation needed.'
    },
    {
        type: 'card',
        tag: 'WALLET',
        title: 'Digital Wallet',
        description: 'Store ride credits, manage refunds, and redeem rewards. Faster settlements without repeated bank calls.'
    },
    {
        type: 'lock',
        tag: 'SECURITY',
        title: 'Micropayments',
        description: 'Small confirmation payments (₹1) ensure commitment and reduce no-shows. Designed for high-frequency transactions.'
    },
    {
        type: 'chart',
        tag: 'TRANSPARENCY',
        title: 'Transaction Transparency',
        description: 'Digital receipts with clear breakdowns: total fare, your share, and savings vs solo travel.'
    },
    {
        type: 'coin',
        tag: 'REWARDS',
        title: 'Rewards & Credits',
        description: 'Earn cashback and ride credits for referrals, frequency, and early adoption. Financial incentives that build loyalty.'
    },
    {
        type: 'cart',
        tag: 'CORPORATE',
        title: 'Corporate Solutions',
        description: 'Centralized billing, monthly reports, and ESG metrics for companies. Reduce reimbursement overhead.'
    }
];

const Features = () => {
    return (
        <section id="features" className="py-24 bg-bg-primary relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-48 w-96 h-96 bg-accent-green/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-accent-emerald/5 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-6 text-white"
                    >
                        Embedded Fintech for Everyone
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-text-secondary text-lg"
                    >
                        Payments, settlement, and cost-sharing are the core enablers of the experience
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
