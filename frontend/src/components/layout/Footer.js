import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800 text-slate-300 py-10 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Tagline */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold text-white">
                Blood Connect
              </span>
            </Link>
            <p className="text-sm text-slate-400">
              Connecting lives through timely blood access. Your trusted platform for blood donation management.
            </p>
            <div className="flex space-x-4">
              <button className="text-slate-400 hover:text-white transition-colors duration-200">
                <Facebook className="w-6 h-6" />
              </button>
              <button className="text-slate-400 hover:text-white transition-colors duration-200">
                <Twitter className="w-6 h-6" />
              </button>
              <button className="text-slate-400 hover:text-white transition-colors duration-200">
                <Linkedin className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors duration-200">About Us</Link></li>
              <li><Link to="/how-to-donate" className="text-slate-400 hover:text-white transition-colors duration-200">How to Donate</Link></li>
              <li><Link to="/blood-centers" className="text-slate-400 hover:text-white transition-colors duration-200">Blood Centers</Link></li>
              <li><Link to="/faqs" className="text-slate-400 hover:text-white transition-colors duration-200">FAQs</Link></li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Legal & Policies</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors duration-200">Terms of Service</Link></li>
              <li><Link to="/medical-compliance" className="text-slate-400 hover:text-white transition-colors duration-200">Medical Compliance</Link></li>
              <li><Link to="/grievance-support" className="text-slate-400 hover:text-white transition-colors duration-200">Grievance Support</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
            <p className="text-sm text-slate-400 mb-2">Email: support@bloodconnect.com</p>
            <p className="text-sm text-slate-400">Phone: +91 12345 67890</p>
            <p className="text-sm text-slate-400 mt-4">Follow us on social media for updates.</p>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-500">
          &copy; {currentYear} Blood Connect. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

