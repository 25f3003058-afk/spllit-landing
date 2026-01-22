import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';

// Core Components
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Integrations from './components/Integrations';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import SEO from './components/SEO';

// Lazy Loaded Pages
const About = lazy(() => import('./pages/About'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const Blog = lazy(() => import('./pages/Blog'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Login = lazy(() => import('./pages/Login'));
import { PrivacyPolicy, TermsOfService, CookiePolicy } from './pages/Legal';

// Loading Fallback
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-bg-primary">
    <div className="w-12 h-12 border-4 border-accent-green border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const Home = () => (
  <>
    <SEO
      title="Split Your Ride, Not Your Wallet"
      description="Join Spllit to save up to 60% on your daily commute. Safe, verified, and automated ride-sharing for students and professionals."
    />
    <Hero />
    <HowItWorks />
    <Features />
    <Integrations />
    <Testimonials />
    <CTA />
  </>
);

import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Scroll to Top Helper
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;
