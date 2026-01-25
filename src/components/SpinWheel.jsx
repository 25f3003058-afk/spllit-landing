import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SpinWheel = ({ onSpinComplete }) => {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);

    const handleSpin = () => {
        if (spinning) return;
        setSpinning(true);

        // Random rotation between 5 and 10 full spins + random segment
        const spins = 360 * 8;
        const randomAngle = Math.floor(Math.random() * 360);
        const totalRotation = spins + randomAngle;

        setRotation(totalRotation);

        setTimeout(() => {
            setSpinning(false);
            onSpinComplete();
        }, 5000); // 5 seconds spin duration
    };

    return (
        <div className="relative w-64 h-64 mx-auto mb-6">
            {/* Pointer */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 text-red-500 filter drop-shadow-lg">
                ▼
            </div>

            {/* Wheel */}
            <motion.div
                className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden relative bg-white"
                animate={{ rotate: rotation }}
                transition={{ duration: 5, ease: "circOut" }}
            >
                {/* Segments */}
                <div className="absolute inset-0" style={{ background: 'conic-gradient(#10b981 0deg 60deg, #34d399 60deg 120deg, #10b981 120deg 180deg, #34d399 180deg 240deg, #10b981 240deg 300deg, #34d399 300deg 360deg)' }}></div>

                {/* Lines */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-white/20 absolute rotate-0"></div>
                    <div className="w-full h-1 bg-white/20 absolute rotate-60"></div>
                    <div className="w-full h-1 bg-white/20 absolute rotate-120"></div>
                </div>

                {/* Labels */}
                <div className="absolute inset-0 text-white font-bold text-xs">
                    <span className="absolute top-8 left-1/2 -translate-x-1/2">5% OFF</span>
                    <span className="absolute bottom-8 left-1/2 -translate-x-1/2 rotate-180">FREE RIDE</span>
                    <span className="absolute top-1/4 right-4 rotate-60">10% OFF</span>
                    <span className="absolute top-1/4 left-4 -rotate-60">₹50 CASH</span>
                    <span className="absolute bottom-1/4 right-4 rotate-120">VIP</span>
                    <span className="absolute bottom-1/4 left-4 -rotate-120">BONUS</span>
                </div>
            </motion.div>

            {/* Center Button */}
            <button
                onClick={handleSpin}
                disabled={spinning}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center font-bold text-accent-green hover:scale-105 transition-transform z-10 border-4 border-gray-100"
            >
                {spinning ? '...' : 'SPIN'}
            </button>
        </div>
    );
};

export default SpinWheel;
