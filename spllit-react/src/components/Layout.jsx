import React from 'react';
import { Canvas } from '@react-three/fiber';
import { View, Preload } from '@react-three/drei';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-bg-primary text-white font-sans selection:bg-accent-green/30 selection:text-white relative">
            <Navbar />
            <main>
                {children}
            </main>
            <Footer />

            {/* Global 3D Canvas for performance consolidation */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <Canvas
                    shadows={false}
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    dpr={[1, 1.5]}
                    gl={{
                        antialias: false,
                        alpha: true,
                        powerPreference: "high-performance",
                        precision: "lowp"
                    }}
                    performance={{ min: 0.5 }}
                    eventSource={document.getElementById('root')}
                    className="w-full h-full"
                >
                    <View.Port />
                    <Preload all />
                </Canvas>
            </div>
        </div>
    );
};

export default Layout;
