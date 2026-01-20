import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const FloatingShape = () => {
    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
            <mesh scale={2.5}>
                <icosahedronGeometry args={[1, 0]} />
                <MeshDistortMaterial
                    color="#10b981"
                    envMapIntensity={1}
                    clearcoat={1}
                    clearcoatRoughness={0}
                    metalness={0.5}
                    distort={0.4}
                    speed={2}
                    wireframe
                />
            </mesh>
        </Float>
    );
};

const Login = () => {
    return (
        <div className="relative h-screen w-full bg-bg-primary overflow-hidden flex flex-col items-center justify-center">
            <Link to="/" className="absolute top-8 left-8 z-20 flex items-center gap-2 text-text-secondary hover:text-white transition-colors">
                <FaArrowLeft /> Back to Home
            </Link>

            <div className="absolute inset-0 z-0">
                <Canvas>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <FloatingShape />
                    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
                        <Text
                            position={[0, 0, 2]}
                            fontSize={1}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                        >
                            Coming Soon
                        </Text>
                    </Float>
                </Canvas>
            </div>

            <div className="relative z-10 text-center mt-40">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-text-secondary text-xl max-w-md mx-auto"
                >
                    We're building a secure, decentralized login experience for you. Stay tuned!
                </motion.p>
            </div>
        </div>
    );
};

export default Login;
