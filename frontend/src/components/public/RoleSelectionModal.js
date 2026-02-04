import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Building2, Droplet, Users, X, ArrowRight, ShieldCheck, Clock, MapPin } from 'lucide-react';

const roles = [
  {
    id: 'donor',
    title: 'Blood Donor',
    icon: Heart,
    description: 'Save lives by donating blood regularly. Be a hero in your community.',
    benefits: ['Save up to 3 lives per donation', 'Free health check-ups', 'Community recognition', 'Flexible scheduling'],
    color: 'bg-red-50 border-red-200 text-red-700',
    iconBg: 'bg-red-100 text-red-600',
    stats: '75,000+ Active Donors'
  },
  {
    id: 'hospital',
    title: 'Hospital',
    icon: Building2,
    description: 'Coordinate emergency blood requests and manage critical patient needs.',
    benefits: ['Real-time donor matching', 'Emergency coordination', 'Inventory tracking', 'Priority support'],
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    iconBg: 'bg-blue-100 text-blue-600',
    stats: '500+ Partner Hospitals'
  },
  {
    id: 'bloodBank',
    title: 'Blood Bank',
    icon: Droplet,
    description: 'Manage blood inventory, process donations, and serve your community.',
    benefits: ['Advanced inventory system', 'Donation processing', 'Quality control', 'Regional coordination'],
    color: 'bg-green-50 border-green-200 text-green-700',
    iconBg: 'bg-green-100 text-green-600',
    stats: '200+ Blood Banks'
  },
  {
    id: 'volunteer',
    title: 'Volunteer',
    icon: Users,
    description: 'Support blood donation drives, awareness campaigns, and community outreach.',
    benefits: ['Flexible participation', 'Leadership opportunities', 'Community impact', 'Skill development'],
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    iconBg: 'bg-purple-100 text-purple-600',
    stats: '2,500+ Volunteers'
  }
];

const RoleCard = ({ role, onSelect, isSelected }) => {
  const Icon = role.icon;

  return (
    <motion.div
      className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg ${
        isSelected ? role.color + ' shadow-lg scale-105' : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(role)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl ${role.iconBg} flex items-center justify-center shadow-soft`}>
          <Icon className="w-7 h-7" />
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{role.title}</h3>
      <p className="text-slate-600 mb-4 text-sm leading-relaxed">{role.description}</p>

      <div className="mb-4">
        <ul className="space-y-1">
          {role.benefits.slice(0, 2).map((benefit, index) => (
            <li key={index} className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-primary-600">{role.stats}</span>
        <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
      </div>
    </motion.div>
  );
};

const RoleSelectionModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [step, setStep] = useState('selection'); // 'selection' or 'confirmation'

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep('confirmation');
  };

  const handleConfirm = () => {
    if (selectedRole) {
      // Store selected role in localStorage for the registration flow
      localStorage.setItem('selectedRole', selectedRole.id);
      onClose();
      // Navigate with role parameter
      navigate('/register', { state: { selectedRole: selectedRole.id } });
    }
  };

  const handleBack = () => {
    setStep('selection');
    setSelectedRole(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {step === 'selection' ? 'Choose Your Role' : 'Confirm Your Choice'}
              </h2>
              <p className="text-slate-600 mt-1">
                {step === 'selection'
                  ? 'Select how you want to contribute to saving lives'
                  : 'Review your selection and get started'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {step === 'selection' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    onSelect={handleRoleSelect}
                    isSelected={selectedRole?.id === role.id}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected Role Summary */}
                {selectedRole && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 ${selectedRole.color}`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${selectedRole.iconBg} flex items-center justify-center`}>
                        <selectedRole.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{selectedRole.title}</h3>
                        <p className="text-slate-600">{selectedRole.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Key Benefits</h4>
                        <ul className="space-y-1">
                          {selectedRole.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                              <ShieldCheck className="w-4 h-4 text-green-500" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">What happens next?</h4>
                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Quick registration (2-3 minutes)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verification and onboarding</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>Access to your dashboard</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Trust Indicators */}
                <div className="bg-slate-50 rounded-2xl p-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Why join BloodConnect?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      <span>Verified & Secure Platform</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span>Trusted by 500+ Hospitals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span>Saved 450,000+ Lives</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
            {step === 'confirmation' && (
              <button
                onClick={handleBack}
                className="btn-secondary"
              >
                ← Back to Selection
              </button>
            )}
            <div className="flex-1"></div>
            {step === 'confirmation' && (
              <button
                onClick={handleConfirm}
                className="btn-primary flex items-center gap-2"
              >
                Get Started as {selectedRole?.title}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RoleSelectionModal;
