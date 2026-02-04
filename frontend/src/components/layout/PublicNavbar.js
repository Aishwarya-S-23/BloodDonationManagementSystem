import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, MapPin, HandHeart, Info, Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const PublicNavbar = () => {
  const { language, toggleLanguage, isEnglish } = useLanguage();

  return (
    <nav className="glass-strong sticky top-0 z-50 border-b border-white/30 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 group transition-transform duration-200 hover:scale-105"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold text-gradient-primary hidden sm:block">
                Blood Connect
              </span>
            </Link>
          </div>

          {/* Public Navigation Links */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleLanguage}
              className="btn-secondary flex items-center gap-2"
              aria-label={`Switch to ${isEnglish ? 'Hindi' : 'English'}`}
            >
              <Languages className="w-5 h-5" />
              <span>{isEnglish ? 'हिं' : 'EN'}</span>
            </button>
            <Link
              to="/blood-centers"
              className="btn-secondary flex items-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              <span>Nearby Blood Centers</span>
            </Link>
            <Link
              to="/how-to-donate"
              className="btn-secondary flex items-center gap-2"
            >
              <Info className="w-5 h-5" />
              <span>Learn How Donation Works</span>
            </Link>
            <Link
              to="/register"
              className="btn-primary flex items-center gap-2"
            >
              <HandHeart className="w-5 h-5" />
              <span>Become a Donor</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;

