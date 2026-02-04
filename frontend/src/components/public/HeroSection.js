import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Info, HandHeart } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative bg-cover bg-center h-[600px] md:h-[700px] flex items-center justify-center text-white"
      style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }} // Assuming you have a hero-bg.jpg in public/images
    >
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent"></div>
      <div className="relative z-10 text-center max-w-4xl px-4">
        <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6 animate-fade-in">
          Connecting lives through timely blood access
        </h1>
        <p className="text-lg md:text-xl text-slate-200 mb-10 animate-fade-in animation-delay-200">
          Hospitals, blood banks, donors, and communities — coordinated in real time.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up animation-delay-400">
          <Link to="/blood-centers" className="btn-primary flex items-center justify-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>View Nearby Blood Centers</span>
          </Link>
          <Link to="/how-to-donate" className="btn-secondary flex items-center justify-center gap-2">
            <Info className="w-5 h-5" />
            <span>Learn How Donation Works</span>
          </Link>
          <Link to="/register" className="btn-emergency flex items-center justify-center gap-2">
            <HandHeart className="w-5 h-5" />
            <span>Become a Donor</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

