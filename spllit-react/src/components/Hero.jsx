import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, MeshDistortMaterial } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as random from 'maath/random/dist/maath-random.esm';
import { FaRobot, FaTimes, FaPowerOff, FaChevronRight } from 'react-icons/fa';

const ParticleField = (props) => {
    const ref = useRef();
    const sphere = useMemo(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }), []);

    useFrame((state, delta) => {
        ref.current.rotation.x -= delta / 10;
        ref.current.rotation.y -= delta / 15;
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#10b981"
                    size={0.002}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
};

const AnimatedAvatar = () => {
    return (
        <Float speed={4} rotationIntensity={1} floatIntensity={2}>
            <mesh scale={1.8}>
                <sphereGeometry args={[1, 64, 64]} />
                <MeshDistortMaterial
                    color="#10b981"
                    envMapIntensity={1}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    metalness={0.5}
                    roughness={0.2}
                    distort={0.4}
                    speed={2}
                />
            </mesh>
        </Float>
    );
};

const TypewriterText = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, 25);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, text, onComplete]);

    return <span>{displayedText}</span>;
};

const Hero = () => {
    const [chatOpen, setChatOpen] = useState(false);
    const [chatStep, setChatStep] = useState(0);

    const handleStartEngine = () => {
        setChatOpen(true);
        setChatStep(1);
    };

    const chatMessages = [
        {
            id: 1,
            text: "System initialized. Welcome to Spllit AI. 🤖",
            delay: 0
        },
        {
            id: 2,
            text: "I'm analyzing your commute patterns... 🔄",
            delay: 1500
        },
        {
            id: 3,
            text: "Optimization complete! I can save you 60% on travel costs by matching you with verified professionals. 💼",
            delay: 3500
        },
        {
            id: 4,
            text: "Would you like to see how our automated fare splitting works?",
            delay: 6000,
            action: true
        }
    ];

    return (
        <section className="relative h-screen w-full overflow-hidden bg-bg-primary flex items-center justify-center">
            {/* 3D Background */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 1] }}>
                    <ParticleField />
                </Canvas>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 relative z-10 text-center flex flex-col items-center justify-center h-full pt-20">
                <AnimatePresence mode="wait">
                    {!chatOpen ? (
                        <motion.div
                            key="hero-content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-4xl"
                        >


                            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
                                The Future of <br />
                                <span className="bg-gradient-to-r from-accent-green via-accent-emerald to-accent-lime bg-clip-text text-transparent">
                                    Shared Transit
                                </span>
                            </h1>

                            <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed">
                                Experience seamless, verified ride-sharing with automated fare splitting and instant settlements.
                            </p>

                            {/* Start Engine Button */}
                            <div className="relative group cursor-pointer" onClick={handleStartEngine}>
                                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl group-hover:bg-red-500/40 transition-all duration-500"></div>
                                <button className="relative w-24 h-24 rounded-full bg-gradient-to-b from-red-500 to-red-700 shadow-[0_0_30px_rgba(220,38,38,0.4)] flex flex-col items-center justify-center border-4 border-red-400/50 group-hover:scale-105 transition-transform duration-300 active:scale-95">
                                    <FaPowerOff className="text-3xl text-white mb-1" />
                                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Start</span>
                                </button>
                                <div className="mt-6 text-sm font-mono text-red-400 tracking-[0.2em] uppercase opacity-70 group-hover:opacity-100 transition-opacity">
                                    Initialize System
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat-interface"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-2xl"
                        >
                            <div className="relative bg-bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                                {/* 3D Avatar */}
                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 pointer-events-none">
                                    <Canvas>
                                        <ambientLight intensity={0.8} />
                                        <pointLight position={[10, 10, 10]} intensity={1.5} />
                                        <AnimatedAvatar />
                                    </Canvas>
                                </div>

                                <div className="mt-16 space-y-6 min-h-[300px] text-left">
                                    {chatMessages.map((msg, index) => (
                                        <div key={msg.id} className={`${chatStep >= index + 1 ? 'block' : 'hidden'}`}>
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex gap-4 items-start"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-green to-accent-emerald flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent-green/20">
                                                    <FaRobot className="text-white text-lg" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10 text-lg leading-relaxed shadow-sm">
                                                        {chatStep >= index + 1 && (
                                                            <TypewriterText
                                                                text={msg.text}
                                                                onComplete={() => {
                                                                    if (index < chatMessages.length - 1) {
                                                                        setTimeout(() => setChatStep(index + 2), 1000);
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    {msg.action && chatStep >= index + 1 && (
                                                        <motion.button
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 2 }}
                                                            onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                                                            className="mt-4 flex items-center gap-2 text-accent-green font-semibold hover:text-accent-emerald transition-colors group"
                                                        >
                                                            Explore Features <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setChatOpen(false)}
                                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default Hero;
