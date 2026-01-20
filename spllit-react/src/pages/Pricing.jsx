import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';

const plans = [
    {
        name: "Commuter",
        price: "Free",
        features: [
            "Pay per ride",
            "Basic route matching",
            "Standard support",
            "Digital receipts"
        ]
    },
    {
        name: "Pro",
        price: "₹199",
        period: "/month",
        popular: true,
        features: [
            "Zero convenience fees",
            "Priority matching",
            "Advanced scheduling",
            "Ride insurance included",
            "2x Reward points"
        ]
    },
    {
        name: "Corporate",
        price: "Custom",
        features: [
            "Centralized billing",
            "Employee dashboard",
            "ESG reporting",
            "Dedicated account manager",
            "24/7 Premium support"
        ]
    }
];

const Pricing = () => {
    return (
        <div className="pt-32 pb-20 container mx-auto px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <h1 className="text-4xl md:text-6xl font-bold mb-6">Simple, Transparent Pricing</h1>
                <p className="text-xl text-text-secondary">Choose the plan that fits your commute style</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative p-8 rounded-2xl border ${plan.popular ? 'bg-bg-card border-accent-green shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-bg-secondary border-accent-green/10'}`}
                    >
                        {plan.popular && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-green text-white px-4 py-1 rounded-full text-sm font-bold">
                                Most Popular
                            </span>
                        )}
                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                        <div className="flex items-baseline justify-center gap-1 mb-8">
                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                            {plan.period && <span className="text-text-muted">{plan.period}</span>}
                        </div>
                        <ul className="space-y-4 mb-8 text-left">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-text-secondary">
                                    <FaCheck className="text-accent-green flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button className={`w-full py-3 rounded-xl font-bold transition-all ${plan.popular ? 'bg-accent-green text-white hover:bg-accent-emerald' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                            Get Started
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Pricing;
