import Navbar from './Navbar';
import Hero from './Hero';
import Problems from './Problems';
import Solutions from './Solutions';
import HowItWorks from './HowItWorks';
import Features from './Features';
import Pricing from './Pricing';
import Trust from './Trust';
import FinalCTA from './FinalCTA';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Problems />
      <Solutions />
      <HowItWorks />
      <Features />
      <Pricing />
      <Trust />
      <FinalCTA />
      <Footer />
    </div>
  );
}
