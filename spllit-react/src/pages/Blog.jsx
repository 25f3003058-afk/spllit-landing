import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaChevronRight, FaArrowLeft, FaTimes, FaBus, FaShieldAlt, FaPlane, FaGraduationCap } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const blogPosts = [
    {
        id: 1,
        title: "The IITM Weekend Rush: Stop Overpaying for Airport Cabs",
        date: "March 15, 2026",
        category: "Campus Life",
        excerpt: "Solo trips to Chennai Airport can cost ₹800+. Learn how Spllit saves you 70% while keeping you secure.",
        content: `
            Every Friday and Sunday, hundreds of IIT Madras students make the trek to Chennai Airport or Central Railway Station. 
            Currently, the only options are high-priced solo cabs or time-consuming local trains. 
            Spllit is changing this by creating a verified pool exclusively for IITM students. 
            
            By matching students heading to the same terminal, we reduce the cost of a ₹900 cab to just ₹225 per person. 
            No more awkward 'Anyone for airport?' messages in dead WhatsApp groups. Just tap, split, and ride.
        `,
        icon: <FaPlane className="text-5xl text-blue-400 opacity-40" />,
        imageGradient: "from-blue-600/20 to-accent-green/20",
        featured: true
    },
    {
        id: 2,
        title: "TCS iON Exam Centers: The 30km Logistic Nightmare",
        date: "March 10, 2026",
        category: "Student Tips",
        excerpt: "Why reaching far-off exam centers like Siruseri shouldn't be your biggest exam stress.",
        content: `
            The dreaded TCS iON exam center at Siruseri or Ambattur is a logistics nightmare for campus residents. 
            Public transport takes 2 hours, and a solo Uber will set you back more than your dinner budget. 
            
            Our 'Exam Center Shield' feature allows students to pre-schedule matches for their specific exam slots. 
            Ensure you reach on time, fresh, and without burning a hole in your pocket. Shared rides are better for the environment and your SGPA!
        `,
        icon: <FaGraduationCap className="text-5xl text-red-400 opacity-40" />,
        imageGradient: "from-red-600/20 to-orange-500/20",
        featured: false
    },
    {
        id: 3,
        title: "Security & Verification: Beyond WhatsApp Groups",
        date: "March 5, 2026",
        category: "Technology",
        excerpt: "How we use @smail.iitm.ac.in verification and automated escrow to protect your money and safety.",
        content: `
            Why trust Spllit over a random WhatsApp group? Verification and Automation. 
            Every user on Spllit is verified via their official college ID or institutional email. 
            
            More importantly, our automated fare splitting uses a secure escrow system. 
            The fare is calculated instantly via our AI, and the split is settled automatically through UPI. 
            No more 'I'll Pay You Later' social friction.
        `,
        icon: <FaShieldAlt className="text-5xl text-accent-green opacity-40" />,
        imageGradient: "from-accent-green/20 to-teal-500/20",
        featured: false
    },
    {
        id: 4,
        title: "Spllit Vision: Zero Social Friction Rides",
        date: "March 1, 2026",
        category: "Company News",
        excerpt: "Experience the future where cost-sharing is as natural as breathing.",
        content: `
            We believe that shared transit is the answer to urban congestion. 
            However, the 'social friction'—asking for money, trusting strangers—is what stops people. 
            
            Spllit removes those barriers. We are building the trust layer of the sharing economy. 
            Starting with the brightest minds at IIT Madras, we aim to expand to every university campus in India by 2027.
        `,
        icon: <FaBus className="text-5xl text-purple-400 opacity-40" />,
        imageGradient: "from-purple-600/20 to-accent-emerald/20",
        featured: false
    }
];

const BlogModal = ({ post, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="relative w-full max-w-2xl bg-bg-secondary border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl z-10"
            >
                {/* Header Image */}
                <div className={`h-48 md:h-64 w-full bg-gradient-to-br ${post.imageGradient} flex items-center justify-center relative`}>
                    <div className="absolute inset-0 bg-grid-white/5" />
                    <div className="p-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
                        {post.icon}
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-all border border-white/10"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="p-8 md:p-12 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="px-3 py-1 rounded-full bg-accent-green/10 text-accent-green text-xs font-bold uppercase tracking-wider">
                            {post.category}
                        </span>
                        <span className="text-text-muted text-xs flex items-center gap-1.5">
                            <FaCalendarAlt /> {post.date}
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                        {post.title}
                    </h2>

                    <div className="space-y-6 text-text-secondary text-lg leading-relaxed">
                        {post.content.split('\n').map((para, i) => (
                            para.trim() && <p key={i}>{para.trim()}</p>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent-green flex items-center justify-center text-black font-bold">S</div>
                            <div>
                                <p className="text-white font-bold text-sm">Spllit Editorial</p>
                                <p className="text-text-muted text-xs">Innovation Team</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-accent-green font-bold text-sm hover:underline"
                        >
                            SHARE ARTICLE
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const BlogCard = ({ post, index, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onClick={onClick}
            className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 cursor-pointer ${post.featured ? 'md:col-span-2' : ''}`}
        >
            {/* Image Placeholder with SVG Pattern */}
            <div className={`aspect-[16/9] w-full bg-gradient-to-br ${post.imageGradient} relative overflow-hidden flex items-center justify-center`}>
                <div className="absolute inset-0 bg-grid-white/5" />

                {/* Abstract SVG Decoration */}
                <svg className="absolute inset-0 w-full h-full opacity-10 group-hover:opacity-20 transition-opacity duration-700" viewBox="0 0 100 100">
                    <circle cx="20" cy="20" r="15" fill="currentColor" />
                    <circle cx="80" cy="80" r="20" fill="currentColor" />
                    <path d="M0 50 Q 25 25 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </svg>

                <div className="relative z-10 transition-transform duration-700 group-hover:scale-110 p-6 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10">
                    {post.icon}
                </div>
            </div>

            <div className="p-6 md:p-8">
                <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-bold uppercase tracking-wider">
                        {post.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-text-muted text-xs">
                        <FaCalendarAlt /> {post.date}
                    </span>
                </div>

                <h2 className="text-xl md:text-3xl font-bold text-white mb-4 group-hover:text-accent-green transition-colors leading-tight">
                    {post.title}
                </h2>

                <p className="text-text-secondary text-sm md:text-base mb-6 line-clamp-2">
                    {post.excerpt}
                </p>

                <div className="flex items-center gap-2 text-accent-green font-bold text-sm tracking-wide group-hover:gap-4 transition-all">
                    READ STORY <FaChevronRight />
                </div>
            </div>
        </motion.div>
    );
};

const Blog = () => {
    const [selectedPost, setSelectedPost] = useState(null);

    return (
        <div className="bg-bg-primary min-h-screen pt-24 pb-20">
            {/* Header / Hero */}
            <div className="relative overflow-hidden py-16 mb-12">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-accent-green/5 blur-[120px] rounded-full" />

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 text-sm group">
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Home
                    </Link>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight"
                    >
                        Inside <span className="bg-gradient-to-r from-accent-green to-emerald-400 bg-clip-text text-transparent">Spllit</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto"
                    >
                        Exploring solutions for the IIT Madras travel crisis and the future of shared campus mobility.
                    </motion.p>
                </div>
            </div>

            {/* Blog Grid */}
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {blogPosts.map((post, index) => (
                        <BlogCard
                            key={post.id}
                            post={post}
                            index={index}
                            onClick={() => setSelectedPost(post)}
                        />
                    ))}
                </div>

                {/* Newsletter Box */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-24 p-8 md:p-12 rounded-[2rem] bg-gradient-to-br from-bg-secondary to-black border border-white/5 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/5 blur-3xl -z-0" />

                    <div className="relative z-10 max-w-2xl">
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Stay Synchronized</h3>
                        <p className="text-text-secondary mb-8">Get the latest on campus transit tech and IITM-specific route updates.</p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="email"
                                placeholder="rollno@smail.iitm.ac.in"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-accent-green transition-colors"
                            />
                            <button className="bg-accent-green hover:bg-accent-emerald text-black font-black px-8 py-4 rounded-xl transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] active:scale-95">
                                SUBSCRIBE
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Modal Detail View */}
            <AnimatePresence>
                {selectedPost && (
                    <BlogModal
                        post={selectedPost}
                        onClose={() => setSelectedPost(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Blog;
