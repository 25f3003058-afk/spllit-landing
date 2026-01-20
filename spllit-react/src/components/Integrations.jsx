import React from 'react';
import { motion } from 'framer-motion';
import { FaStripe, FaGooglePay, FaApplePay, FaAmazonPay } from 'react-icons/fa';
import { SiPhonepe, SiPaytm, SiRazorpay } from 'react-icons/si';

const Integrations = () => {
    return (
        <section id="integrations" className="py-24 bg-bg-secondary">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-6"
                    >
                        Seamless Payments & Trusted Integrations
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-text-secondary text-lg"
                    >
                        Built to support India's most popular payment methods and trusted infrastructure partners
                    </motion.p>
                </div>

                <div className="space-y-16">
                    {/* Payment Gateways */}
                    <div>
                        <h3 className="text-2xl font-bold text-center mb-8">Payment Gateways</h3>
                        <div className="flex flex-wrap justify-center gap-6">
                            <IntegrationCard icon={<FaStripe className="text-4xl text-[#635BFF]" />} name="Stripe" status="Active" active />
                            <IntegrationCard icon={<SiRazorpay className="text-4xl text-[#0C2D48]" />} name="Razorpay" status="Planned" />
                            <IntegrationCard icon={<SiPaytm className="text-4xl text-[#002E6E]" />} name="Paytm" status="Planned" />
                        </div>
                        <p className="text-center text-text-muted mt-6 text-sm italic">
                            Currently using Stripe for secure payment processing. Additional gateways will be supported as the platform scales.
                        </p>
                    </div>

                    {/* UPI & Digital Payments */}
                    <div>
                        <h3 className="text-2xl font-bold text-center mb-8">UPI & Digital Payments</h3>
                        <div className="flex flex-wrap justify-center gap-6">
                            <IntegrationCard icon={<FaGooglePay className="text-4xl text-white" />} name="Google Pay" />
                            <IntegrationCard icon={<SiPhonepe className="text-4xl text-[#5f259f]" />} name="PhonePe" />
                            <IntegrationCard icon={<FaAmazonPay className="text-4xl text-white" />} name="Amazon Pay" />
                            <IntegrationCard icon={<FaApplePay className="text-4xl text-white" />} name="Apple Pay" />
                        </div>
                        <p className="text-center text-text-muted mt-6 text-sm italic">
                            UPI-based payments supported through integrated payment partners at the app level.
                        </p>
                    </div>
                </div>

                <div className="mt-20 p-6 rounded-xl bg-accent-green/5 border border-accent-green/10 text-center max-w-3xl mx-auto">
                    <p className="text-text-muted text-sm">
                        Some integrations are planned and will be rolled out in phases. Initial launch uses Stripe for secure payment processing.
                    </p>
                </div>
            </div>
        </section>
    );
};

const IntegrationCard = ({ icon, name, status, active }) => (
    <motion.div
        whileHover={{ y: -10, rotateX: 10, rotateY: 10, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`relative px-8 py-6 rounded-xl bg-bg-card border ${active ? 'border-accent-green/40 bg-accent-green/5' : 'border-accent-green/10'} min-w-[160px] flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-accent-green/20`}
        style={{ transformStyle: 'preserve-3d' }}
    >
        <div className="transform translate-z-10">
            {icon}
        </div>
        <span className="font-semibold text-lg text-text-secondary">{name}</span>
        {status && (
            <span className={`absolute -top-2 -right-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-accent-green text-white' : 'bg-accent-emerald/20 text-accent-emerald'}`}>
                {status}
            </span>
        )}
    </motion.div>
);

export default Integrations;
