import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaLock, FaUserShield } from 'react-icons/fa';

const LegalLayout = ({ title, lastUpdated, children, icon }) => (
    <div className="bg-bg-primary min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent-green/10 border border-accent-green/20 text-accent-green mb-8 text-4xl">
                    {icon}
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-4">{title}</h1>
                <p className="text-text-muted">Last Updated: {lastUpdated}</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="prose prose-invert prose-green max-w-none bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-8 text-text-secondary leading-relaxed"
            >
                {children}
            </motion.div>
        </div>
    </div>
);

export const PrivacyPolicy = () => (
    <LegalLayout title="Privacy Policy" lastUpdated="January 23, 2026" icon={<FaUserShield />}>
        <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p>At Spllit, we collect information to provide better services to our users. For IIT Madras students, this includes your official @smail.iitm.ac.in email address, name, and basic profile information to ensure a secure campus community.</p>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Information</h2>
            <p>We use the information we collect to match you with compatible riders, automate fare splitting via secure UPI gateways, and maintain the safety and integrity of the Spllit ecosystem.</p>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Data Security</h2>
            <p>We implement advanced encryption and security protocols to protect your data. Your payment information is handled through verified bank-grade aggregators and is never stored directly on our servers.</p>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Sharing Your Information</h2>
            <p>Your contact details are only shared with your matched ride partners once a match is confirmed. We do not sell your personal data to third parties for marketing purposes.</p>
        </section>
    </LegalLayout>
);

export const TermsOfService = () => (
    <LegalLayout title="Terms of Service" lastUpdated="January 23, 2026" icon={<FaShieldAlt />}>
        <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>By using the Spllit application, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. User Conduct</h2>
            <p>Users must behave professionally and respectfully. Any form of harassment, discrimination, or fraudulent activity will result in immediate termination of your account.</p>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Fare Splitting & Payments</h2>
            <p>Spllit acts as a facilitator for fare splitting. Users are responsible for ensuring they have sufficient funds and completing the automated UPI sequence initiated by the app.</p>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Liability</h2>
            <p>Spllit is a technology platform connecting riders. We are not a transport provider and are not liable for any incidents during third-party rides, although we provide safety features like verified profiles.</p>
        </section>
    </LegalLayout>
);

export const CookiePolicy = () => (
    <LegalLayout title="Cookie Policy" lastUpdated="January 23, 2026" icon={<FaLock />}>
        <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. What are Cookies?</h2>
            <p>Cookies are small text files stored on your device that help us recognize you and remember your preferences for a smoother experience.</p>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Why We Use Cookies</h2>
            <p>We use essential cookies for authentication and security. We also use analytical cookies to understand how students interact with the app to improve the matching algorithm.</p>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Managing Cookies</h2>
            <p>Most browsers allow you to control cookies through their settings. However, disabling essential cookies may prevent you from using certain features of Spllit, such as maintaining your login session.</p>
        </section>
    </LegalLayout>
);
