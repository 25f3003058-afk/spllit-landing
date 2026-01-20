import React from 'react';
import { motion } from 'framer-motion';

const blogPosts = [
    {
        title: "The Future of Shared Mobility in India",
        date: "March 15, 2026",
        category: "Industry Trends",
        excerpt: "How UPI and digital infrastructure are enabling a new era of micro-transit."
    },
    {
        title: "Why Automated Fare Splitting Matters",
        date: "March 10, 2026",
        category: "Product",
        excerpt: "Removing the social friction from cost-sharing is key to adoption."
    },
    {
        title: "Spllit Launches in Bangalore",
        date: "March 1, 2026",
        category: "Company News",
        excerpt: "We're excited to bring our services to India's tech capital."
    }
];

const Blog = () => {
    return (
        <div className="pt-32 pb-20 container mx-auto px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <h1 className="text-4xl md:text-6xl font-bold mb-12 text-center">Latest Updates</h1>
                <div className="grid gap-8">
                    {blogPosts.map((post, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-bg-card p-8 rounded-2xl border border-accent-green/10 hover:border-accent-green/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4 mb-4 text-sm">
                                <span className="text-accent-green font-semibold">{post.category}</span>
                                <span className="text-text-muted">{post.date}</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-accent-emerald transition-colors">{post.title}</h2>
                            <p className="text-text-secondary">{post.excerpt}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Blog;
