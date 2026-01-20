import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaHandshake, FaCreditCard, FaCar, FaMotorcycle } from 'react-icons/fa';
import confetti from 'canvas-confetti';

const steps = [
    {
        id: '01',
        icon: <FaMapMarkerAlt className="text-2xl text-white" />,
        title: 'Enter Route',
        description: 'Set pickup & drop.'
    },
    {
        id: '02',
        icon: <FaHandshake className="text-2xl text-white" />,
        title: 'Connect',
        description: 'Match with riders.'
    },
    {
        id: '03',
        icon: <FaCreditCard className="text-2xl text-white" />,
        title: 'Auto Split',
        description: 'Fare calculated.'
    },
    {
        id: '04',
        icon: <FaCar className="text-2xl text-white" />,
        title: 'Ride',
        description: 'Enjoy commute.'
    }
];

const HowItWorks = () => {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        if (activeStep === steps.length - 1) {
            triggerConfetti();
        }
    }, [activeStep]);

    const triggerConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    };

    return (
        <section id="how-it-works" className="py-20 bg-bg-secondary relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-4"
                    >
                        From Intent to Action
                    </motion.h2>
                    <p className="text-text-secondary text-lg">
                        Hover over the steps to drive the experience
                    </p>
                </div>

                {/* 3D Path Container */}
                <div className="relative max-w-4xl mx-auto h-[300px] flex items-center justify-center">
                    {/* Road Base */}
                    <div className="absolute w-full h-3 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                        <div className="w-full h-full bg-gray-700 opacity-30" />
                        {/* Road Markings */}
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-dashed border-t border-dashed border-gray-500/50 -translate-y-1/2" />
                    </div>

                    {/* Progress Bar (Green Trace) */}
                    <motion.div
                        className="absolute left-0 h-3 bg-gradient-to-r from-accent-green to-accent-emerald rounded-full z-0 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                        transition={{ type: "spring", stiffness: 40, damping: 20 }}
                    />

                    {/* Motorbike Avatar */}
                    <motion.div
                        className="absolute z-20 text-accent-green filter drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                        initial={{ left: '0%' }}
                        animate={{ left: `${(activeStep / (steps.length - 1)) * 100}%` }}
                        transition={{ type: "spring", stiffness: 40, damping: 20 }}
                        style={{ x: '-50%' }}
                    >
                        <div className="relative">
                            <FaMotorcycle className="text-4xl transform -scale-x-100" />
                            {/* Smoke Effect */}
                            <motion.div
                                animate={{ opacity: [0, 0.4, 0], x: [-5, -20], scale: [0.5, 1.2] }}
                                transition={{ repeat: Infinity, duration: 0.4 }}
                                className="absolute bottom-1 right-0 w-3 h-3 bg-gray-400 rounded-full blur-sm"
                            />
                        </div>
                    </motion.div>

                    {/* Steps */}
                    <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center z-10 px-4">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                onMouseEnter={() => setActiveStep(index)}
                                className="relative group cursor-pointer flex flex-col items-center"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                {/* Step Node */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${index <= activeStep ? 'bg-bg-card border-accent-green shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-bg-card border-gray-700'}`}>
                                    <div className={`${index <= activeStep ? 'text-accent-green' : 'text-gray-500'} transition-colors duration-300 text-lg`}>
                                        {step.icon}
                                    </div>
                                </div>

                                {/* Step Info Card */}
                                <div className={`absolute top-20 w-32 text-center transition-opacity duration-300 ${index === activeStep ? 'opacity-100' : 'opacity-60'}`}>
                                    <h3 className={`text-base font-bold mb-1 transition-colors ${index <= activeStep ? 'text-white' : 'text-gray-500'}`}>{step.title}</h3>
                                    <p className="text-xs text-text-secondary">{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
