import React from 'react';
import { motion } from 'framer-motion';

const CTA = () => {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-green/20 to-accent-emerald/5 z-0"></div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <h2 className="text-4xl md:text-6xl font-bold mb-8">
                        Ready to Transform Your Daily Commute?
                    </h2>
                    <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto">
                        Join early access and be part of the shared mobility revolution. Safe, affordable, and eco-friendly.
                    </p>
                    <button className="bg-gradient-to-r from-accent-green to-accent-emerald text-white px-10 py-5 rounded-xl font-bold text-xl hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1">
                        Join Early Access
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

export default CTA;
