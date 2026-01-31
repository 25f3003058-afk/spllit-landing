import React from 'react';
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
        </div>
    );
};

export default Layout;
