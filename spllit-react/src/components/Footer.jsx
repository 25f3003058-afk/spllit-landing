import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaLinkedin, FaInstagram, FaGithub, FaPaperPlane } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-[#050505] pt-24 pb-12 border-t border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-green/5 rounded-full blur-[128px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-emerald/5 rounded-full blur-[128px] pointer-events-none"></div>

            {/* Spllit Watermark */}
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full max-w-6xl opacity-[0.05] pointer-events-none select-none z-0 flex justify-center translate-y-1/3">
                <img src="/spllit-watermark.png" alt="" className="w-full h-auto" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
                    {/* Brand Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link to="/" className="inline-block">
                            <span className="text-3xl font-bold text-white tracking-tight">
                                spllit<span className="text-accent-green">.</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 leading-relaxed max-w-sm">
                            The embedded fintech infrastructure for modern shared mobility. We automate fare splitting, micropayments, and settlements in real-time.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-accent-green hover:text-black transition-all duration-300">
                                <FaTwitter />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-accent-green hover:text-black transition-all duration-300">
                                <FaLinkedin />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-accent-green hover:text-black transition-all duration-300">
                                <FaInstagram />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-accent-green hover:text-black transition-all duration-300">
                                <FaGithub />
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-2 lg:col-start-6">
                        <h4 className="text-white font-semibold text-lg mb-6">Product</h4>
                        <ul className="space-y-4">
                            <li><a href="/#features" className="text-gray-400 hover:text-accent-green transition-colors">Features</a></li>
                            <li><a href="/#how-it-works" className="text-gray-400 hover:text-accent-green transition-colors">How it Works</a></li>
                            <li><a href="/#pricing" className="text-gray-400 hover:text-accent-green transition-colors">Pricing</a></li>
                            <li><a href="/#api" className="text-gray-400 hover:text-accent-green transition-colors">API Docs</a></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="text-white font-semibold text-lg mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li><Link to="/about" className="text-gray-400 hover:text-accent-green transition-colors">About Us</Link></li>
                            <li><Link to="/blog" className="text-gray-400 hover:text-accent-green transition-colors">Blog</Link></li>
                            <li><Link to="/careers" className="text-gray-400 hover:text-accent-green transition-colors">Careers</Link></li>
                            <li><Link to="/contact" className="text-gray-400 hover:text-accent-green transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div className="lg:col-span-3">
                        <h4 className="text-white font-semibold text-lg mb-6">Stay Updated</h4>
                        <p className="text-gray-400 mb-6 text-sm">
                            Subscribe to our newsletter for the latest updates and feature releases.
                        </p>
                        <form className="relative">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/50 transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent-green text-black rounded-md hover:bg-accent-emerald transition-colors"
                            >
                                <FaPaperPlane size={14} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} Spllit Inc. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
                        <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Terms of Service</a>
                        <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
