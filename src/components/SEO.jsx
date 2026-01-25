import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url }) => {
    const siteName = 'Spllit';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const siteDescription = description || 'Spllit: The future of shared mobility. Save up to 60% on your daily commute with real-time route matching and automated fare splitting.';
    const siteKeywords = keywords || 'Spllit, ride sharing, carpooling, fare splitting, shared mobility, India commute';
    const siteUrl = url || 'https://spllit.app/';
    const siteImage = image || 'https://spllit.app/logo-full.png';

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={siteDescription} />
            <meta name="keywords" content={siteKeywords} />
            <link rel="canonical" href={siteUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={siteUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={siteDescription} />
            <meta property="og:image" content={siteImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={siteUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={siteDescription} />
            <meta name="twitter:image" content={siteImage} />
        </Helmet>
    );
};

export default SEO;
