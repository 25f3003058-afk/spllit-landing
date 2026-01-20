import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, Box, Cylinder, Text, RoundedBox, Environment, useTexture } from '@react-three/drei';

const FeatureIcon3D = ({ type }) => {
    return (
        <div className="w-full h-full">
            <Canvas shadows dpr={[1, 2]}>
                <ambientLight intensity={1} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#10b981" />
                <Environment preset="city" />
                <Float speed={3} rotationIntensity={0.4} floatIntensity={0.5}>

                    {/* Credit Card (Realistic) */}
                    {type === 'card' && (
                        <group rotation={[0.4, 0.2, 0]} scale={1.8}>
                            {/* Card Body */}
                            <RoundedBox args={[2.2, 1.4, 0.02]} radius={0.1} smoothness={4}>
                                <meshPhysicalMaterial
                                    color="#1e293b"
                                    metalness={0.6}
                                    roughness={0.2}
                                    clearcoat={1}
                                    clearcoatRoughness={0.1}
                                />
                            </RoundedBox>
                            {/* Chip */}
                            <Box position={[-0.7, 0.2, 0.02]} args={[0.3, 0.25, 0.01]}>
                                <meshPhysicalMaterial color="#fbbf24" metalness={1} roughness={0.3} />
                            </Box>
                            {/* Strip */}
                            <Box position={[0, -0.4, 0.02]} args={[2.2, 0.2, 0.001]}>
                                <meshBasicMaterial color="#10b981" />
                            </Box>
                            {/* Text Details */}
                            <Text position={[-0.5, 0, 0.03]} fontSize={0.12} color="#94a3b8" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
                                **** **** **** 4242
                            </Text>
                            <Text position={[0.6, 0.5, 0.03]} fontSize={0.15} color="white" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
                                RuPay
                            </Text>
                        </group>
                    )}

                    {/* Receipt / Bill (Realistic Paper) */}
                    {type === 'bill' && (
                        <group rotation={[0.2, -0.2, 0]} scale={2}>
                            <RoundedBox args={[1.2, 1.8, 0.02]} radius={0.05} smoothness={4}>
                                <meshPhysicalMaterial color="#f8fafc" roughness={0.8} metalness={0} />
                            </RoundedBox>
                            {/* Header */}
                            <Box position={[0, 0.7, 0.02]} args={[1.2, 0.2, 0.001]}>
                                <meshBasicMaterial color="#10b981" />
                            </Box>
                            {/* Lines */}
                            <Box position={[0, 0.3, 0.02]} args={[0.8, 0.05, 0.001]}><meshBasicMaterial color="#cbd5e1" /></Box>
                            <Box position={[0, 0.1, 0.02]} args={[0.8, 0.05, 0.001]}><meshBasicMaterial color="#cbd5e1" /></Box>
                            <Box position={[0, -0.1, 0.02]} args={[0.8, 0.05, 0.001]}><meshBasicMaterial color="#cbd5e1" /></Box>
                            {/* Total */}
                            <Box position={[0, -0.5, 0.02]} args={[0.5, 0.1, 0.001]}><meshBasicMaterial color="#0f172a" /></Box>
                        </group>
                    )}

                    {/* Coin Stack (Realistic Gold) */}
                    {type === 'coin' && (
                        <group rotation={[0.5, 0, 0]} scale={2}>
                            <Cylinder args={[0.6, 0.6, 0.1, 64]} position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <meshPhysicalMaterial color="#fbbf24" metalness={1} roughness={0.1} clearcoat={1} />
                            </Cylinder>
                            <Cylinder args={[0.6, 0.6, 0.1, 64]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <meshPhysicalMaterial color="#f59e0b" metalness={1} roughness={0.1} clearcoat={1} />
                            </Cylinder>
                            <Cylinder args={[0.6, 0.6, 0.1, 64]} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <meshPhysicalMaterial color="#fbbf24" metalness={1} roughness={0.1} clearcoat={1} />
                            </Cylinder>
                            <Text position={[0, 0.2, 0.06]} fontSize={0.5} color="#78350f" rotation={[0, 0, 0]}>
                                ₹
                            </Text>
                        </group>
                    )}

                    {/* Shopping Cart (Sleek Metal) */}
                    {type === 'cart' && (
                        <group rotation={[0.2, -0.3, 0]} scale={1.5}>
                            <Box position={[0, 0, 0]} args={[1.5, 1, 1.2]}>
                                <meshPhysicalMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} wireframe wireframeLinewidth={1.5} />
                            </Box>
                            <Box position={[-0.9, 0.6, 0]} args={[0.2, 0.8, 0.1]} rotation={[0, 0, -0.5]}>
                                <meshPhysicalMaterial color="#64748b" metalness={0.5} roughness={0.5} />
                            </Box>
                            <Cylinder position={[-0.5, -0.6, 0.5]} args={[0.15, 0.15, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]}><meshPhysicalMaterial color="#1e293b" /></Cylinder>
                            <Cylinder position={[0.5, -0.6, 0.5]} args={[0.15, 0.15, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]}><meshPhysicalMaterial color="#1e293b" /></Cylinder>
                            <Box position={[0, 0, 0]} args={[1, 0.8, 0.8]}>
                                <meshPhysicalMaterial color="#10b981" transmission={0.5} opacity={0.5} transparent roughness={0} />
                            </Box>
                        </group>
                    )}

                    {/* Lock (Metallic) */}
                    {type === 'lock' && (
                        <group scale={1.8}>
                            <RoundedBox args={[1, 0.8, 0.4]} radius={0.1} position={[0, -0.3, 0]}>
                                <meshPhysicalMaterial color="#059669" metalness={0.7} roughness={0.2} clearcoat={1} />
                            </RoundedBox>
                            <Cylinder args={[0.1, 0.1, 0.8]} position={[-0.3, 0.3, 0]}><meshPhysicalMaterial color="#cbd5e1" metalness={1} roughness={0.1} /></Cylinder>
                            <Cylinder args={[0.1, 0.1, 0.8]} position={[0.3, 0.3, 0]}><meshPhysicalMaterial color="#cbd5e1" metalness={1} roughness={0.1} /></Cylinder>
                            <Cylinder args={[0.4, 0.4, 0.1]} position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}><meshPhysicalMaterial color="#cbd5e1" metalness={1} roughness={0.1} /></Cylinder>
                        </group>
                    )}

                    {/* Chart (Glass) */}
                    {type === 'chart' && (
                        <group position={[0, -0.5, 0]} scale={1.8}>
                            <Box position={[-0.5, 0.5, 0]} args={[0.4, 1, 0.4]}><meshPhysicalMaterial color="#10b981" transmission={0.6} opacity={0.8} transparent roughness={0.1} /></Box>
                            <Box position={[0, 1, 0]} args={[0.4, 2, 0.4]}><meshPhysicalMaterial color="#34d399" transmission={0.6} opacity={0.8} transparent roughness={0.1} /></Box>
                            <Box position={[0.5, 1.5, 0]} args={[0.4, 3, 0.4]}><meshPhysicalMaterial color="#059669" transmission={0.6} opacity={0.8} transparent roughness={0.1} /></Box>
                        </group>
                    )}

                </Float>
            </Canvas>
        </div>
    );
};

const FlipCard = ({ feature }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="relative w-full h-96 perspective-1000 group cursor-pointer"
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
        >
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-500"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* Front Face: Dark Theme + 3D Icon + Heading */}
                <div className="absolute inset-0 backface-hidden bg-bg-card rounded-[2rem] shadow-xl border border-accent-green/10 flex flex-col items-center justify-between p-8 overflow-hidden">
                    {/* Subtle Glow */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-green/5 rounded-full blur-3xl group-hover:bg-accent-green/10 transition-colors"></div>

                    {/* 3D Icon Container */}
                    <div className="w-64 h-64 relative z-10 -mt-10">
                        <FeatureIcon3D type={feature.type} />
                    </div>

                    {/* Heading on Front */}
                    <div className="relative z-10 text-center mt-auto pb-4">
                        <h3 className="text-2xl font-bold text-gray-400 font-poppins tracking-wide uppercase group-hover:text-accent-green transition-colors">{feature.tag}</h3>
                    </div>
                </div>

                {/* Back Face: Info with Black Bg & Yellow Text */}
                <div
                    className="absolute inset-0 backface-hidden bg-black rounded-[2rem] shadow-2xl flex flex-col items-center justify-center p-8 text-center rotate-y-180 border border-yellow-400/20"
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    <h3 className="text-2xl font-bold text-yellow-400 mb-4 font-poppins tracking-wide">{feature.title}</h3>
                    <p className="text-gray-300 font-medium leading-relaxed font-poppins text-sm">
                        {feature.description}
                    </p>
                    <div className="mt-8">
                        <button className="px-6 py-2 rounded-full border border-yellow-400/30 text-yellow-400 text-sm font-bold hover:bg-yellow-400 hover:text-black transition-all">
                            Learn More
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const features = [
    {
        type: 'bill',
        tag: 'SPLITTING',
        title: 'Automated Fare Splitting',
        description: 'Real-time calculation of each rider\'s share based on distance traveled. Zero manual calculation needed.'
    },
    {
        type: 'card',
        tag: 'WALLET',
        title: 'Digital Wallet',
        description: 'Store ride credits, manage refunds, and redeem rewards. Faster settlements without repeated bank calls.'
    },
    {
        type: 'lock',
        tag: 'SECURITY',
        title: 'Micropayments',
        description: 'Small confirmation payments (₹1) ensure commitment and reduce no-shows. Designed for high-frequency transactions.'
    },
    {
        type: 'chart',
        tag: 'TRANSPARENCY',
        title: 'Transaction Transparency',
        description: 'Digital receipts with clear breakdowns: total fare, your share, and savings vs solo travel.'
    },
    {
        type: 'coin',
        tag: 'REWARDS',
        title: 'Rewards & Credits',
        description: 'Earn cashback and ride credits for referrals, frequency, and early adoption. Financial incentives that build loyalty.'
    },
    {
        type: 'cart',
        tag: 'CORPORATE',
        title: 'Corporate Solutions',
        description: 'Centralized billing, monthly reports, and ESG metrics for companies. Reduce reimbursement overhead.'
    }
];

const Features = () => {
    return (
        <section id="features" className="py-24 bg-bg-primary relative">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-6 text-white"
                    >
                        Embedded Fintech for Everyone
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-text-secondary text-lg"
                    >
                        Payments, settlement, and cost-sharing are the core enablers of the experience
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <FlipCard feature={feature} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
