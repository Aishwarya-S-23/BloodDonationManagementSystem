import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import Footer from './Footer';

const Layout = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Don't show layout on auth pages
  if (!isAuthenticated || location.pathname.startsWith('/login') || location.pathname.startsWith('/register')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-beige-50 flex flex-col">
      {/* Skip link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="skip-link"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      {/* Top Navbar - Always visible */}
      <Navbar />

      {/* Main Content */}
      <main id="main-content" className="flex-1 pb-20 md:pb-6" role="main" aria-label="Main content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Bottom Tab Navigation - Mobile only */}
      {isMobile && <BottomNav />}
      <Footer />
    </div>
  );
};

export default Layout;

