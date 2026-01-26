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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                    {/* Left Column - Brand */}
                    <div className="space-y-6">
                        <Link to="/" className="inline-block">
                            <span className="text-3xl font-bold text-white tracking-tight">
                                spllit<span className="text-accent-green">.</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 leading-relaxed max-w-md">
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

                    {/* Right Column - Links Grid */}
                    <div className="grid grid-cols-2 gap-8">
                        {/* Product Links */}
                        <div>
                            <h4 className="text-white font-semibold text-lg mb-4">Product</h4>
                            <ul className="space-y-3">
                                <li><Link to="/features" className="text-gray-400 hover:text-accent-green transition-colors text-sm">Features</Link></li>
                                <li><Link to="/how-it-works" className="text-gray-400 hover:text-accent-green transition-colors text-sm">How it Works</Link></li>
                                <li><Link to="/pricing" className="text-gray-400 hover:text-accent-green transition-colors text-sm">Pricing</Link></li>
                            </ul>
                        </div>

                        {/* Company Links */}
                        <div>
                            <h4 className="text-white font-semibold text-lg mb-4">Company</h4>
                            <ul className="space-y-3">
                                <li><Link to="/about" className="text-gray-400 hover:text-accent-green transition-colors text-sm">About Us</Link></li>
                                <li><Link to="/blog" className="text-gray-400 hover:text-accent-green transition-colors text-sm">Blog</Link></li>
                                <li><Link to="/faq" className="text-gray-400 hover:text-accent-green transition-colors text-sm">FAQ</Link></li>
                            </ul>
                        </div>

                        {/* Support - Full Width Below */}
                        <div className="col-span-2">
                            <h4 className="text-white font-semibold text-lg mb-4">Contact</h4>
                            <div className="flex flex-col gap-2">
                                <a href="mailto:support@spllit.app" className="text-gray-400 hover:text-accent-green transition-colors text-sm">
                                    support@spllit.app
                                </a>
                                <a href="mailto:info@spllit.app" className="text-gray-400 hover:text-accent-green transition-colors text-sm">
                                    info@spllit.app
                                </a>
                            </div>
                        </div>
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
