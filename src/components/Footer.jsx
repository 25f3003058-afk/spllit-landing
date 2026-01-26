import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaLinkedin, FaInstagram, FaWhatsapp, FaPaperPlane } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-[#050505] pt-12 md:pt-20 pb-8 md:pb-12 border-t border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-green/5 rounded-full blur-[128px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-emerald/5 rounded-full blur-[128px] pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 mb-12 md:mb-16">
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
                            <a href="https://www.linkedin.com/company/spllit/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-accent-green hover:text-black transition-all duration-300">
                                <FaLinkedin />
                            </a>
                            <a href="https://www.instagram.com/spllit_official/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-accent-green hover:text-black transition-all duration-300">
                                <FaInstagram />
                            </a>
                            <a href="https://chat.whatsapp.com/H49JywLfKsxAoC8X5wC0yg" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-accent-green hover:text-black transition-all duration-300">
                                <FaWhatsapp />
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-2 lg:col-start-6">
                        <h4 className="text-white font-semibold text-lg mb-6">Product</h4>
                        <ul className="space-y-4">
                            <li><Link to="/features" className="text-gray-400 hover:text-accent-green transition-colors">Features</Link></li>
                            <li><Link to="/how-it-works" className="text-gray-400 hover:text-accent-green transition-colors">How it Works</Link></li>
                            <li><Link to="/pricing" className="text-gray-400 hover:text-accent-green transition-colors">Pricing</Link></li>
                            <li><Link to="/faq" className="text-gray-400 hover:text-accent-green transition-colors">API Docs</Link></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="text-white font-semibold text-lg mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li><Link to="/about" className="text-gray-400 hover:text-accent-green transition-colors">About Us</Link></li>
                            <li><Link to="/blog" className="text-gray-400 hover:text-accent-green transition-colors">Blog</Link></li>
                            <li><Link to="/faq" className="text-gray-400 hover:text-accent-green transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="text-white font-semibold text-lg mb-6">Support</h4>
                        <ul className="space-y-4 text-sm">
                            <li>
                                <a href="mailto:support@spllit.app" className="text-gray-400 hover:text-accent-green transition-colors flex flex-col">
                                    <span className="text-xs text-text-muted mb-1">Support</span>
                                    support@spllit.app
                                </a>
                            </li>
                            <li>
                                <a href="mailto:info@spllit.app" className="text-gray-400 hover:text-accent-green transition-colors flex flex-col">
                                    <span className="text-xs text-text-muted mb-1">Information</span>
                                    info@spllit.app
                                </a>
                            </li>
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
                        <Link to="/privacy" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="text-gray-500 hover:text-white text-sm transition-colors">Terms of Service</Link>
                        <Link to="/cookies" className="text-gray-500 hover:text-white text-sm transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
