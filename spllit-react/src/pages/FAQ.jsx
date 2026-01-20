import React from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaMinus } from 'react-icons/fa';

const faqs = [
    {
        question: "How does the fare splitting work?",
        answer: "Our algorithm calculates the exact distance each rider travels. The total fare is split proportionally, so you only pay for what you use."
    },
    {
        question: "Is it safe to ride with strangers?",
        answer: "Safety is our priority. All riders are verified through government ID and corporate email. We also offer women-only ride matching."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major UPI apps (Google Pay, PhonePe, Paytm), credit/debit cards, and net banking."
    },
    {
        question: "Can I schedule rides in advance?",
        answer: "Yes! You can schedule rides up to 7 days in advance for your daily commute."
    }
];

const FAQ = () => {
    const [openIndex, setOpenIndex] = React.useState(null);

    return (
        <div className="pt-32 pb-20 container mx-auto px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto"
            >
                <h1 className="text-4xl md:text-6xl font-bold mb-12 text-center">Frequently Asked Questions</h1>
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-bg-card rounded-xl border border-accent-green/10 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <span className="font-semibold text-lg">{faq.question}</span>
                                {openIndex === index ? <FaMinus className="text-accent-green" /> : <FaPlus className="text-text-muted" />}
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-6 text-text-secondary leading-relaxed border-t border-accent-green/5 pt-4">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default FAQ;
