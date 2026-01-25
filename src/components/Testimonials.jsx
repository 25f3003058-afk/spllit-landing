import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
    {
        quote: "Spllit has completely changed my daily commute. I'm saving ₹3000 every month and meeting great people!",
        author: "Student, Mumbai",
        role: "Daily Commuter",
        initials: "SM"
    },
    {
        quote: "The automatic fare splitting is genius. No more awkward UPI requests or cash handling. Just seamless sharing.",
        author: "Professional, Bangalore",
        role: "Tech Worker",
        initials: "PT"
    },
    {
        quote: "Our campus runs on Spllit now. Safe, verified riders only. The women-only option is a game-changer for safety.",
        author: "Student, Delhi",
        role: "Campus Ambassador",
        initials: "RC"
    }
];

const Testimonials = () => {
    return (
        <section className="py-24 bg-bg-primary">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-6"
                    >
                        Built for Students, Professionals & Teams
                    </motion.h2>
                    <p className="text-text-secondary text-lg">
                        Join thousands optimizing their daily commute
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-2xl bg-bg-card border border-accent-green/10 hover:border-accent-green/30 transition-all"
                        >
                            <div className="mb-6">
                                <p className="text-text-secondary italic text-lg leading-relaxed">"{item.quote}"</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-green to-accent-emerald flex items-center justify-center font-bold text-white">
                                    {item.initials}
                                </div>
                                <div>
                                    <div className="font-semibold text-white">{item.author}</div>
                                    <div className="text-sm text-text-muted">{item.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
