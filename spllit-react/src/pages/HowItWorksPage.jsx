import React from 'react';
import { motion } from 'framer-motion';
import HowItWorks from '../components/HowItWorks';

const HowItWorksPage = () => {
    return (
        <div className="pt-20">
            <div className="bg-bg-secondary py-20 border-b border-white/5">
                <div className="container mx-auto px-6 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-accent-green to-accent-emerald bg-clip-text text-transparent"
                    >
                        How It Works
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-text-secondary max-w-2xl mx-auto"
                    >
                        A seamless experience from matching to settlement.
                    </motion.p>
                </div>
            </div>

            <div className="py-20">
                <HowItWorks />
            </div>
        </div>
    );
};

export default HowItWorksPage;
