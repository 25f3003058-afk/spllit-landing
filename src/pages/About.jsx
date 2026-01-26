import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
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

const TeamCard = ({ name, role, location, image, bio, specialties }) => {
    const x = React.useMotionValue(0);
    const y = React.useMotionValue(0);

    const mouseXSpring = motion.useSpring(x);
    const mouseYSpring = motion.useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative h-[450px] w-full perspective-1000"
        >
            {/* Main Card Body */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:border-accent-green/30 group-hover:shadow-[0_20px_80px_rgba(16,185,129,0.15)] overflow-hidden">

                {/* Decorative Light Streak */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-green/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-100"></div>

                {/* Background Noise/Texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                {/* Content Layout */}
                <div className="relative h-full p-8 flex flex-col items-center text-center" style={{ transform: "translateZ(50px)" }}>

                    {/* ID Tag Style Accessory */}
                    <div className="absolute top-6 right-8 opacity-40 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
                            <span className="text-[10px] font-mono text-white/50 tracking-widest uppercase">Verified Core</span>
                        </div>
                    </div>

                    {/* Image Container with Custom Shape/Mask */}
                    <div className="relative mb-8 mt-4">
                        <div className="absolute -inset-4 bg-accent-green/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="relative w-32 h-32 p-1 bg-gradient-to-br from-accent-green to-accent-emerald rounded-[2.5rem] overflow-hidden rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                            <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-bg-primary">
                                <img
                                    src={image || "/logo-icon.png"}
                                    alt={name}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-2 mb-6">
                        <h4 className="text-3xl font-bold text-white tracking-tight">{name}</h4>
                        <div className="inline-block px-4 py-1 rounded-full bg-accent-green/10 border border-accent-green/20">
                            <p className="text-accent-green font-bold text-xs uppercase tracking-[0.2em]">{role}</p>
                        </div>
                    </div>

                    {/* Bio Snippet (Logic Type Addition) */}
                    <p className="text-text-secondary text-sm leading-relaxed mb-8 max-w-[240px] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                        {bio || "Architecting the infrastructure that powers tomorrow's metropolitan transit networks."}
                    </p>

                    {/* Social Logic */}
                    <div className="mt-auto flex items-center justify-center gap-4 translate-y-8 group-hover:translate-y-0 transition-all duration-500 delay-200">
                        {[
                            { icon: FaLinkedin, link: "#", label: "LinkedIn" },
                            { icon: FaTwitter, link: "#", label: "Twitter" },
                            { icon: FaGithub, link: "#", label: "GitHub" }
                        ].map((social, idx) => (
                            <a
                                key={idx}
                                href={social.link}
                                className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-accent-green hover:bg-accent-green/10 hover:border-accent-green/30 transition-all duration-300 backdrop-blur-md"
                                title={social.label}
                            >
                                <social.icon size={18} />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Decorative Accent Glow */}
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-green/5 rounded-full blur-[80px] group-hover:bg-accent-green/10 transition-all duration-700"></div>
            </div>
        </motion.div>
    );
};

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
                    className="relative max-w-5xl mx-auto aspect-video rounded-[4rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10 group cursor-pointer bg-bg-secondary flex items-center justify-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-green/5 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="relative z-20 w-32 h-32 bg-accent-green rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_80px_rgba(16,185,129,0.6)] transition-all duration-500"
                    >
                        <FaPlay className="text-black text-4xl ml-2" />
                    </motion.div>

                    {/* Decorative background elements for the placeholder */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-[url('/logo-icon.png')] bg-center bg-no-repeat bg-contain scale-150 blur-sm"></div>
                    </div>
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
                        name="Ankit Raj Choudhari"
                        role="Founder & CEO"
                        location="IIT Madras, India"
                        image="/logo-icon.png"
                        bio="Visionary strategist focused on disrupting the urban mobility landscape through intelligent fintech integration."
                    />
                    <TeamCard
                        name="Raunak Ratan"
                        role="Co-Founder & CTO"
                        location="IIT Madras, India"
                        image="/logo-icon.png"
                        bio="Engineering architect pioneering automated real-time settlement protocols for shared economy platforms."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
                    <TeamCard
                        name="Shivam"
                        role="Lead Engineer"
                        location="Chennai, IIT Madras"
                        bio="Full-stack specialist building high-concurrency systems that handle thousands of simultaneous transactions."
                    />
                    <TeamCard
                        name="Sakshi"
                        role="Product Designer"
                        location="Bangalore, India"
                        bio="Crafting frictionless user experiences and premium visual identities that define the future of transit UI."
                    />
                    <TeamCard
                        name="Saurav Yadav"
                        role="Lead Engineer"
                        location="Chennai, IIT Madras"
                        bio="Backend mastermind optimizing matching algorithms to ensure maximum efficiency in every shared journey."
                    />
                </div>
            </section>
        </div>
    );
};

export default About;
