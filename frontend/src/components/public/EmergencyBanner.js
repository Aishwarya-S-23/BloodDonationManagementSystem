import React from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmergencyBanner = ({ isEmergency = false, message = "", bloodGroup = "O-", platelets = true }) => {
  if (!isEmergency) return null;

  const displayMessage = message || 
                       `Increased demand for ${bloodGroup}${platelets ? ' and platelets' : ''} in your area`;

  return (
    <AnimatePresence>
      {isEmergency && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-emergency-light text-white p-4 text-center shadow-lg relative z-40"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
            <TriangleAlert className="w-6 h-6 flex-shrink-0" />
            <p className="font-semibold text-sm md:text-base">{displayMessage}.</p>
            <Link
              to="/how-to-help-emergency"
              className="bg-white text-emergency-light px-4 py-2 rounded-full text-sm font-semibold 
                         hover:bg-white/90 transition-colors duration-200 whitespace-nowrap"
            >
              View How You Can Help
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmergencyBanner;

