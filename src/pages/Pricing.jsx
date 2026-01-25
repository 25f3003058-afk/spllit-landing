import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';
import SEO from '../components/SEO';

// Lazy load InstituteSection for better performance
const InstituteSection = lazy(() => import('../components/InstituteSection'));

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
        price: "₹1",
        originalPrice: "₹199",
        period: "/month",
        popular: true,
        isBeta: true,
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
        <div className="pt-20 min-h-screen bg-black text-white px-4">
            <SEO
                title="Pricing & Savings"
                description="Transparent fare splitting and cost savings. See how much you can save on your daily commute with Spllit."
            />
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">Simple, Transparent Pricing</h1>
                    <p className="text-xl text-text-secondary">Choose the plan that fits your commute style</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
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

                            {plan.isBeta && (
                                <div className="mb-4">
                                    <span className="bg-accent-green/10 text-accent-green text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-accent-green/20">
                                        Beta Testing Special
                                    </span>
                                </div>
                            )}

                            <div className="flex flex-col items-center mb-8">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                    {plan.period && <span className="text-text-muted">{plan.period}</span>}
                                </div>
                                {plan.originalPrice && (
                                    <div className="mt-1">
                                        <span className="text-text-muted line-through text-lg">{plan.originalPrice}</span>
                                    </div>
                                )}
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

            {/* Institute Section - Lazy Loaded */}
            <Suspense fallback={
                <div className="py-20 bg-bg-primary flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-accent-green border-t-transparent rounded-full animate-spin"></div>
                </div>
            }>
                <InstituteSection />
            </Suspense>
        </div>
    );
};

export default Pricing;
