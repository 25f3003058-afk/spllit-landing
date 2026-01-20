import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Integrations from './components/Integrations';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import About from './pages/About';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import Blog from './pages/Blog';
import FAQ from './pages/FAQ';
import Pricing from './pages/Pricing';
import Login from './pages/Login';

const Home = () => (
  <>
    <Hero />
    <HowItWorks />
    <Features />
    <Integrations />
    <Testimonials />
    <CTA />
  </>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
