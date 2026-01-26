import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
    {
        quote: "Currently, solo commuting eats 40% of my stipend. I'm waiting for Spllit to launch so I can finally share rides safely and save that ₹3000 every month.",
        author: "Student, Mumbai",
        role: "Anticipated User",
        initials: "SM"
    },
    {
        quote: "The manual UPI calculations after every shared cab are a nightmare. Spllit's automated settlement is the missing piece for our office group's daily travel.",
        author: "Professional, Bangalore",
        role: "Tech Worker",
        initials: "PT"
    },
    {
        quote: "Safety is my main concern for late-night campus travel. A verified, student-only community will finally give me the confidence to share rides without worry.",
        author: "Student, Delhi",
        role: "Early Adopter",
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
                        Join the waitlist of thousands ready to revolutionize their daily commute
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
