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

// Mobile-Specific Cyber-Stream Component
const MobileTimeline = ({ activeStep, setActiveStep, progress }) => (
    <div className="relative w-full max-w-sm mx-auto flex gap-6 px-4 py-8">
        {/* The Power Stream (Track) */}
        <div className="relative w-1.5 flex-shrink-0 bg-gray-900 rounded-full overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/5">
            {/* Background Dim Trace */}
            <div className="absolute inset-0 bg-accent-green/10" />

            {/* Active Light Trace */}
            <motion.div
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-accent-green via-accent-emerald to-accent-lime shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                animate={{ height: `${progress}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 30 }}
            />

            {/* Pulsing Energy Nodes */}
            {steps.map((_item, i) => (
                <motion.div
                    key={i}
                    className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all duration-300 z-10 
                    ${i <= activeStep ? 'bg-accent-green border-white shadow-[0_0_10px_rgba(16,185,129,1)]' : 'bg-gray-800 border-white/10'}`}
                    style={{ top: `${(i / (steps.length - 1)) * 100}%` }}
                />
            ))}
        </div>

        {/* Rider (The Hoverbike) */}
        <motion.div
            className="absolute left-4 z-20 text-accent-green filter drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]"
            animate={{ top: `calc(${progress}% + 32px)` }} // Adjust for padding
            transition={{ type: "spring", stiffness: 100, damping: 30 }}
            style={{ x: '1px', y: '-50%' }}
        >
            <div className="relative">
                <motion.div
                    animate={{ rotate: [85, 95, 85] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                >
                    <FaMotorcycle className="text-4xl" />
                </motion.div>
                {/* Energy Exhaust */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <motion.div
                        animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.5], y: [0, -20] }}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                        className="w-4 h-4 bg-accent-green/40 rounded-full blur-md"
                    />
                </div>
            </div>
        </motion.div>

        {/* Step Cards Container */}
        <div className="flex flex-col justify-between flex-1 py-0 h-[600px]">
            {steps.map((step, index) => (
                <motion.div
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    className={`relative group cursor-pointer transition-all duration-500 
                    ${index === activeStep ? 'scale-105' : 'scale-95 opacity-50'}`}
                >
                    <div className={`
                    relative p-5 rounded-2xl backdrop-blur-2xl border transition-all duration-500 overflow-hidden
                    ${index === activeStep
                            ? 'bg-white/10 border-accent-green/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-accent-green/20'
                            : 'bg-gray-900/40 border-white/5'
                        }
                `}>
                        {/* Scanning Line (Only for active card) */}
                        {index === activeStep && (
                            <motion.div
                                animate={{ left: ['-100%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 w-20 h-full bg-gradient-to-r from-transparent via-accent-green/10 to-transparent -skew-x-12"
                            />
                        )}

                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                            ${index <= activeStep ? 'bg-accent-green text-black' : 'bg-gray-800 text-gray-400'}
                        `}>
                                {step.icon}
                            </div>
                            <div className="text-left">
                                <h3 className={`text-lg font-bold transition-all ${index <= activeStep ? 'text-white' : 'text-gray-500'}`}>
                                    {step.title}
                                </h3>
                                <p className="text-xs text-text-secondary line-clamp-1">{step.description}</p>
                            </div>
                        </div>

                        {/* Corner Accent */}
                        <div className={`absolute top-0 right-0 w-8 h-8 opacity-20 pointer-events-none 
                        ${index <= activeStep ? 'bg-accent-green blur-xl' : 'bg-transparent'}`}
                        />
                    </div>

                    {/* Connection Pill (Small indicator when not active) */}
                    <div className={`absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-[2px] 
                    ${index <= activeStep ? 'bg-accent-green shadow-[0_0_5px_rgba(16,185,129,1)]' : 'bg-white/10'}`}
                    />
                </motion.div>
            ))}
        </div>
    </div>
);

// Desktop Road Component
const DesktopTimeline = ({ activeStep, setActiveStep, progress }) => (
    <div className="relative max-w-4xl mx-auto h-[300px] flex items-center justify-center">
        {/* The Road */}
        <div className="absolute w-full h-3 bg-gray-800 rounded-full overflow-hidden shadow-inner flex items-center">
            <div className="w-full h-full bg-gray-700 opacity-30" />
            <div className="absolute top-1/2 left-0 w-full h-[1px] -translate-y-1/2 bg-dashed border-accent-green/20 border-t border-dashed" />
            <motion.div
                className="absolute h-full left-0 top-0 bg-gradient-to-r from-accent-green to-accent-emerald rounded-full z-0 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 30 }}
            />
        </div>

        {/* Motorbike */}
        <motion.div
            className="absolute z-20 text-accent-green filter drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"
            initial={{ left: '0%' }}
            animate={{ left: `${progress}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 30 }}
            style={{ x: '-50%' }}
        >
            <div className="relative">
                <FaMotorcycle className="text-4xl transform -scale-x-100" />
                <motion.div
                    animate={{ opacity: [0, 0.4, 0], x: [-5, -20], scale: [0.5, 1.2] }}
                    transition={{ repeat: Infinity, duration: 0.4 }}
                    className="absolute bottom-1 right-0 w-3 h-3 bg-gray-400 rounded-full blur-sm"
                />
            </div>
        </motion.div>

        {/* Nodes */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-row justify-between items-center px-4 z-10">
            {steps.map((step, index) => (
                <motion.div
                    key={step.id}
                    onMouseEnter={() => setActiveStep(index)}
                    onClick={() => setActiveStep(index)}
                    className="relative group cursor-pointer flex flex-col items-center flex-1"
                    whileHover={{ scale: 1.05 }}
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${index <= activeStep ? 'bg-bg-card border-accent-green shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-bg-card border-gray-700'}`}>
                        <div className={`${index <= activeStep ? 'text-accent-green' : 'text-gray-500'} transition-colors duration-300 text-xl`}>
                            {step.icon}
                        </div>
                    </div>
                    <div className={`absolute top-20 w-32 text-center transition-all duration-300 ${index === activeStep ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`}>
                        <h3 className={`text-base font-bold transition-colors ${index <= activeStep ? 'text-white' : 'text-gray-500'}`}>{step.title}</h3>
                        <p className="text-xs text-text-secondary line-clamp-2">{step.description}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
);

const HowItWorks = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (activeStep === steps.length - 1) {
            triggerConfetti();
        }
    }, [activeStep]);

    const progress = (activeStep / (steps.length - 1)) * 100;

    return (
        <section id="how-it-works" className="py-20 bg-bg-secondary relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-block px-4 py-1.5 rounded-full border border-accent-green/20 bg-accent-green/5 backdrop-blur-md mb-6"
                    >
                        <span className="text-xs font-bold tracking-[0.3em] text-accent-green uppercase">The User Experience</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight"
                    >
                        From Intent to <span className="text-accent-green">Action</span>
                    </motion.h2>
                    <p className="text-text-secondary text-lg">
                        {isMobile ? 'Tap through the sequence to interact' : 'Jump between steps to see the ride flow'}
                    </p>
                </div>

                {isMobile ?
                    <MobileTimeline activeStep={activeStep} setActiveStep={setActiveStep} progress={progress} /> :
                    <DesktopTimeline activeStep={activeStep} setActiveStep={setActiveStep} progress={progress} />
                }
            </div>
        </section>
    );
};

export default HowItWorks;
