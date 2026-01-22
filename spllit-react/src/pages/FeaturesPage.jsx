import React, { useState, useRef, Suspense, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFrame } from '@react-three/fiber';
import { View, Environment, Float, PerspectiveCamera, ContactShadows, MeshTransmissionMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import Lottie from 'lottie-react';
import Features from '../components/Features';

// Lottie animation URL for celebration
const CELEBRATION_LOTTIE = "https://assets9.lottiefiles.com/packages/lf20_u4yrau.json"; // Confetti/Celebration

const StaticCoins = () => {
    const coinCount = 50;
    const coins = useMemo(() => Array.from({ length: coinCount }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 1.2;
        return {
            position: [
                Math.cos(angle) * radius,
                -1.8 + Math.random() * 1.8,
                Math.sin(angle) * radius
            ],
            rotation: [
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            ]
        };
    }), []);

    return (
        <group>
            {coins.map((coin, i) => (
                <mesh key={i} position={coin.position} rotation={coin.rotation}>
                    <cylinderGeometry args={[0.35, 0.35, 0.06, 32]} />
                    <meshStandardMaterial
                        color="#FFD700"
                        metalness={1}
                        roughness={0.1}
                        emissive="#FFD700"
                        emissiveIntensity={0.2}
                    />
                </mesh>
            ))}
        </group>
    );
};

const Coin = ({ onComplete }) => {
    const meshRef = useRef();
    const [startTime] = useState(Date.now());
    const duration = 1000;

    useFrame(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const x = -5 + (5 * progress);
        const y = -1 + Math.sin(progress * Math.PI) * 5;
        const z = 0;

        if (meshRef.current) {
            meshRef.current.position.set(x, y, z);
            meshRef.current.rotation.x += 0.2;
            meshRef.current.rotation.y += 0.2;
            meshRef.current.scale.setScalar(1 - (progress * 0.5));
        }

        if (progress === 1) {
            onComplete();
        }
    });

    return (
        <mesh ref={meshRef}>
            <cylinderGeometry args={[0.4, 0.4, 0.08, 32]} />
            <meshStandardMaterial
                color="#FFD700"
                metalness={1}
                roughness={0.1}
                emissive="#FFD700"
                emissiveIntensity={0.5}
            />
        </mesh>
    );
};

const Jar = ({ shake }) => {
    const groupRef = useRef();

    // Create a realistic jar shape using LatheGeometry
    const points = useMemo(() => {
        const pts = [];
        for (let i = 0; i < 20; i++) {
            const x = 1.5 + Math.sin(i * 0.2) * 0.3;
            const y = (i - 10) * 0.2;
            pts.push(new THREE.Vector2(x, y));
        }
        // Add rim
        pts.push(new THREE.Vector2(1.7, 2));
        pts.push(new THREE.Vector2(1.4, 2.1));
        return pts;
    }, []);

    useFrame((state) => {
        if (shake && groupRef.current) {
            groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 50) * 0.1;
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 40) * 0.05;
        } else if (groupRef.current) {
            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1);
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
        }
    });

    return (
        <group ref={groupRef} position={[0, -1, 0]}>
            {/* Realistic Glass Jar Body */}
            <mesh castShadow receiveShadow>
                <latheGeometry args={[points, 64]} />
                <MeshTransmissionMaterial
                    backside
                    samples={16}
                    thickness={1.5}
                    chromaticAberration={0.05}
                    anisotropy={0.1}
                    distortion={0.1}
                    distortionScale={0.1}
                    temporalDistortion={0.1}
                    transmission={1}
                    roughness={0.05}
                    color="#f0f9ff"
                    ior={1.5}
                />
            </mesh>

            {/* Jar Rim - Metallic Silver */}
            <mesh position={[0, 2.05, 0]}>
                <torusGeometry args={[1.55, 0.1, 16, 100]} />
                <meshStandardMaterial
                    color="#e2e8f0"
                    metalness={1}
                    roughness={0.1}
                    envMapIntensity={2}
                />
            </mesh>

            {/* Static Coins Filling the Jar */}
            <StaticCoins />
        </group>
    );
};

const Scene = ({ coins, removeCoin, shake }) => {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 1, 10]} fov={35} />

            <ambientLight intensity={1} />
            <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
            <directionalLight position={[-10, 10, 5]} intensity={1.5} color="#ffffff" />
            <pointLight position={[0, 5, 5]} intensity={1.5} color="#10b981" />

            <Suspense fallback={null}>
                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
                    <Jar shake={shake} />
                </Float>

                {coins.map(id => (
                    <Coin key={id} onComplete={() => removeCoin(id)} />
                ))}

                <Sparkles count={40} scale={8} size={2} speed={0.4} color="#10b981" opacity={0.5} />

                <Environment preset="apartment" />

                <ContactShadows
                    position={[0, -4.5, 0]}
                    opacity={0.4}
                    scale={15}
                    blur={2.5}
                    far={10}
                    color="#000000"
                />
            </Suspense>
        </>
    );
};

const SavingsJackpot = () => {
    const [coins, setCoins] = useState([]);
    const [savings, setSavings] = useState(0);
    const [showRibbon, setShowRibbon] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [showLottie, setShowLottie] = useState(false);

    const handleSave = () => {
        const id = Date.now();
        setCoins(prev => [...prev, id]);
        setSavings(prev => prev + 1);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);

        // Show celebration every 5 coins or on first coin
        if ((savings + 1) % 5 === 0 || savings === 0) {
            setShowLottie(true);
            setShowRibbon(true);
            setTimeout(() => {
                setShowLottie(false);
                setShowRibbon(false);
            }, 4000);
        }
    };

    const removeCoin = (id) => {
        setCoins(prev => prev.filter(c => c !== id));
    };

    return (
        <section className="py-32 relative overflow-hidden bg-bg-primary">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="relative h-[700px] rounded-[4rem] bg-gradient-to-b from-black/60 to-black/20 border border-white/10 shadow-[0_0_100px_rgba(16,185,129,0.1)] overflow-hidden group">
                        {/* Lottie Celebration Overlay */}
                        <AnimatePresence>
                            {showLottie && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-40 pointer-events-none"
                                >
                                    <Lottie
                                        animationData={null}
                                        path={CELEBRATION_LOTTIE}
                                        loop={false}
                                        className="w-full h-full"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 3D View */}
                        <div className="absolute inset-0 z-10">
                            <View className="w-full h-full">
                                <Scene coins={coins} removeCoin={removeCoin} shake={isShaking} />
                            </View>
                        </div>

                        {/* Congratulations Ribbon */}
                        <AnimatePresence mode="wait">
                            {showRibbon && (
                                <motion.div
                                    initial={{ opacity: 0, y: -50, scale: 0.5 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 50, scale: 0.5 }}
                                    className="absolute top-12 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-6"
                                >
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-accent-green/20 blur-2xl rounded-full"></div>
                                        <div className="relative bg-gradient-to-r from-accent-green via-accent-emerald to-accent-green bg-[length:200%_auto] animate-gradient px-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.3)] border border-white/20 text-center">
                                            <p className="text-black font-black text-2xl font-poppins mb-1">
                                                🎉 JACKPOT!
                                            </p>
                                            <p className="text-black/90 font-bold text-lg font-poppins">
                                                You saved 1 Carbon Coin
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Savings Counter */}
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 w-full max-w-xs px-6">
                            <motion.div
                                key={savings}
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur-2xl border border-white/20 px-10 py-6 rounded-[2.5rem] text-center shadow-2xl"
                            >
                                <p className="text-accent-green text-xs uppercase tracking-[0.3em] font-black mb-2 font-poppins">Total Carbon Savings</p>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-5xl font-black text-white font-poppins">{savings}</span>
                                    <span className="text-accent-green text-xl font-bold font-poppins">COINS</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-green rounded-full blur-[120px]"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-emerald rounded-full blur-[120px]"></div>
                        </div>
                    </div>

                    <div className="max-w-xl">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "100px" }}
                            className="h-1.5 bg-accent-green mb-10 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                        ></motion.div>
                        <h2 className="text-6xl md:text-8xl font-black text-white mb-10 leading-[0.9] font-poppins tracking-tighter">
                            The Savings <br />
                            <span className="text-accent-green">Jackpot.</span>
                        </h2>
                        <p className="text-text-secondary text-2xl leading-relaxed mb-14 font-light font-poppins">
                            Every trip you split contributes to your personal carbon jackpot. Watch your impact grow in real-time with our 3D savings engine.
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(16,185,129,0.6)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            className="bg-accent-green text-black px-16 py-8 rounded-full font-black text-2xl shadow-2xl transition-all duration-300 flex items-center gap-6 group font-poppins"
                        >
                            <span>SAVE NOW</span>
                            <motion.div
                                animate={{
                                    rotate: [0, 10, -10, 10, 0],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                💰
                            </motion.div>
                        </motion.button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FeaturesPage = () => {
    return (
        <div className="bg-bg-primary min-h-screen">
            <div className="pt-48 pb-20">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-6 py-2 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm font-bold tracking-[0.2em] uppercase mb-8 font-poppins"
                    >
                        Next-Gen Features
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-bold mb-8 text-white font-poppins"
                    >
                        Engineered for <br />
                        <span className="bg-gradient-to-r from-accent-green via-accent-emerald to-accent-lime bg-clip-text text-transparent">Efficiency</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-text-secondary max-w-2xl mx-auto font-light leading-relaxed font-poppins"
                    >
                        Explore the cutting-edge technology behind Spllit's shared mobility infrastructure. Built for scale, designed for simplicity.
                    </motion.p>
                </div>
            </div>

            <SavingsJackpot />

            <div className="py-20">
                <Features />
            </div>
        </div>
    );
};

export default FeaturesPage;
