import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Environment, Float, OrbitControls, Text, PerspectiveCamera } from '@react-three/drei';
import { FaLinkedin, FaTwitter, FaGithub, FaPlay, FaUniversity, FaRocket } from 'react-icons/fa';
import {
    SiNodedotjs,
    SiVercel,
    SiMongodb,
    SiAmazonwebservices,
    SiGooglecloud,
    SiStripe
} from 'react-icons/si';

const SponsorMarquee = () => {
    const sponsors = [
        { name: "Node.js", color: "#68a063", icon: SiNodedotjs },
        { name: "IIT Madras", color: "#ffffff", image: "/iitm-logo.png" },
        { name: "E-Summit", color: "#34d399", icon: FaRocket },
        { name: "MongoDB", color: "#13aa52", icon: SiMongodb },
        { name: "AWS", color: "#ff9900", icon: SiAmazonwebservices },
        { name: "Vercel", color: "#ffffff", icon: SiVercel },
        { name: "Google Cloud", color: "#4285F4", icon: SiGooglecloud },
        { name: "Stripe", color: "#635BFF", icon: SiStripe }
    ];

    const displaySponsors = [...sponsors, ...sponsors];

    return (
        <div className="relative flex overflow-hidden py-8 bg-black/20 backdrop-blur-sm border-y border-white/5">
            <motion.div
                className="flex whitespace-nowrap"
                animate={{ x: [0, -1920] }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {displaySponsors.map((s, i) => (
                    <div
                        key={`${s.name}-${i}`}
                        className="flex items-center justify-center mx-12 group"
                    >
                        <div className="relative">
                            <div
                                className="absolute -inset-4 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full"
                                style={{ backgroundColor: s.color }}
                            ></div>
                            <div className="relative flex items-center gap-6 px-10 py-5 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-all duration-300 transform group-hover:scale-110 group-hover:-rotate-2">
                                {s.image ? (
                                    <img
                                        src={s.image}
                                        alt={s.name}
                                        className="h-10 w-auto object-contain brightness-110 contrast-125 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                    />
                                ) : (
                                    <s.icon
                                        className="text-4xl shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                        style={{ color: s.color }}
                                    />
                                )}
                                <span className="text-2xl font-bold text-white/70 group-hover:text-white transition-colors font-poppins tracking-tight">
                                    {s.name}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-bg-primary to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-bg-primary to-transparent z-10"></div>
        </div>
    );
};

const TeamCard = ({ name, role, location, image }) => (
    <motion.div
        whileHover={{ y: -15, rotateY: 10, rotateX: 5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-bg-card p-8 rounded-[2.5rem] border border-accent-green/10 shadow-2xl relative overflow-hidden group perspective-1000"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-accent-green/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
            <div className="w-28 h-28 bg-gradient-to-br from-accent-green to-accent-emerald rounded-3xl mb-8 mx-auto overflow-hidden border-4 border-white/5 shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                <img src={image || "/logo-icon.png"} alt={name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2 font-poppins text-center">{name}</h4>
            <p className="text-accent-green font-semibold text-base mb-4 font-poppins text-center">{role}</p>
            <div className="flex items-center justify-center gap-2 text-text-secondary text-sm mb-8 font-poppins">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green/40"></div>
                {location}
            </div>
            <div className="flex justify-center gap-6">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-secondary hover:bg-accent-green hover:text-black transition-all duration-300 shadow-lg"><FaLinkedin /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-secondary hover:bg-accent-green hover:text-black transition-all duration-300 shadow-lg"><FaTwitter /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-secondary hover:bg-accent-green hover:text-black transition-all duration-300 shadow-lg"><FaGithub /></a>
            </div>
        </div>
    </motion.div>
);

const About = () => {
    const { scrollYProgress } = useScroll();
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);

    return (
        <div className="bg-bg-primary min-h-screen font-poppins overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-accent-green/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[5%] w-[500px] h-[500px] bg-accent-emerald/5 rounded-full blur-[150px]"></div>
            </div>

            <section className="pt-48 pb-32 container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        style={{ y: y1 }}
                        className="relative group"
                    >
                        {/* Premium 3D Container for Logo */}
                        <div className="absolute -inset-10 bg-accent-green/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000"></div>
                        <div className="relative z-10 p-12 rounded-[4rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.4)] transform group-hover:scale-[1.05] group-hover:rotate-1 transition-all duration-700 overflow-hidden">
                            {/* Animated Background Glow */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-green/5 via-transparent to-accent-emerald/5 opacity-50"></div>

                            {/* The Logo with Enhanced Background Removal */}
                            <div className="relative z-20 flex flex-col items-center w-full">
                                <div className="relative w-full flex justify-center">
                                    <img
                                        src="/spllit-brand.jpg"
                                        alt="Spllit Brand"
                                        className="w-full max-w-[400px] h-auto mix-blend-screen brightness-150 contrast-[200%] transition-all duration-700"
                                        style={{
                                            maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
                                            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)'
                                        }}
                                    />
                                </div>
                                {/* Enhanced Tagline Overlay */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-8 px-8 py-3 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm font-bold tracking-[0.3em] uppercase shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                >
                                    Next-Gen Infrastructure
                                </motion.div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-green/20 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent-emerald/20 rounded-full blur-3xl"></div>
                        </div>
                    </motion.div>

                    <motion.div
                        style={{ y: y2 }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "80px" }}
                            className="h-1 bg-accent-green mb-6 rounded-full"
                        ></motion.div>
                        <h2 className="text-accent-green font-bold tracking-[0.3em] text-xs mb-4 uppercase">The Genesis</h2>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-[1.1]">
                            The Future of <br />
                            <span className="bg-gradient-to-r from-accent-green via-accent-emerald to-accent-lime bg-clip-text text-transparent">Mobility Fintech</span>
                        </h1>
                        <p className="text-text-secondary text-xl leading-relaxed mb-10 font-light">
                            Spllit was born from a simple observation: shared mobility is the future, but the payment friction is stuck in the past. We started with a mission to automate the complex world of fare splitting and settlements.
                        </p>
                        <p className="text-text-secondary text-xl leading-relaxed font-light">
                            Today, we are building the embedded fintech infrastructure that powers modern transit operators, making every journey seamless, transparent, and fair for everyone involved.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Adjusted Sponsor Marquee Spacing */}
            <section className="py-16 relative z-10">
                <div className="container mx-auto px-6 mb-8 text-center">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-white mb-2 tracking-tight"
                    >
                        Backed & Powered By
                    </motion.h3>
                    <p className="text-text-secondary font-light">Collaborating with industry leaders to redefine transit.</p>
                </div>

                <SponsorMarquee />
            </section>

            <section className="py-32 container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Real Problems, <span className="text-accent-green">Real Solutions</span></h2>
                    <p className="text-text-secondary text-xl font-light leading-relaxed">
                        Watch how Spllit is tackling real-world mobility challenges and creating success stories for transit operators worldwide.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative max-w-5xl mx-auto aspect-video rounded-[4rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10 group cursor-pointer bg-bg-secondary"
                >
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-700 z-10 flex items-center justify-center">
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            className="w-24 h-24 bg-accent-green rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                        >
                            <FaPlay className="text-black text-3xl ml-2" />
                        </motion.div>
                    </div>
                    <iframe
                        className="w-full h-full relative z-0 grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                        title="Spllit Success Story"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </motion.div>
            </section>

            <section className="py-32 container mx-auto px-6 relative z-10">
                <div className="text-center mb-24">
                    <h2 className="text-accent-green font-bold tracking-[0.4em] text-xs mb-6 uppercase">The Architects</h2>
                    <h3 className="text-5xl md:text-7xl font-bold text-white mb-8">Meet Our Team</h3>
                    <div className="w-24 h-1 bg-gradient-to-r from-accent-green to-transparent mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-5xl mx-auto mb-32">
                    <TeamCard
                        name="Founder Name"
                        role="Founder & CEO"
                        location="IIT Madras, India"
                        image="/logo-icon.png"
                    />
                    <TeamCard
                        name="Co-Founder Name"
                        role="Co-Founder & CTO"
                        location="IIT Madras, India"
                        image="/logo-icon.png"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <TeamCard
                        name="Team Member 1"
                        role="Lead Engineer"
                        location="Bangalore, India"
                    />
                    <TeamCard
                        name="Team Member 2"
                        role="Product Designer"
                        location="Mumbai, India"
                    />
                    <TeamCard
                        name="Team Member 3"
                        role="Marketing Lead"
                        location="Delhi, India"
                    />
                </div>
            </section>
        </div>
    );
};

export default About;
