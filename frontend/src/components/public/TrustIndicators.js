import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Users, Heart, CheckCircle, AlertTriangle, Clock, MapPin } from 'lucide-react';

const TrustIndicators = () => {
  const safetyRules = [
    { icon: ShieldCheck, title: 'Sterile Equipment', description: 'Single-use, sterilized needles and equipment' },
    { icon: Heart, title: 'Health Screening', description: 'Comprehensive health check before donation' },
    { icon: Clock, title: 'Rest Period', description: 'Mandatory rest and refreshments after donation' },
    { icon: Users, title: 'Trained Staff', description: 'Certified medical professionals oversee all procedures' }
  ];

  const eligibilityCriteria = [
    { condition: 'Age 18-65 years', eligible: true },
    { condition: 'Weight 50kg or more', eligible: true },
    { condition: 'No recent tattoos/piercings (6 months)', eligible: true },
    { condition: 'No chronic illnesses', eligible: true },
    { condition: 'No recent surgeries (6 months)', eligible: true },
    { condition: 'Hemoglobin level 12.5g/dL+', eligible: true }
  ];

  const associations = [
    { name: 'Ministry of Health & Family Welfare', type: 'Government' },
    { name: 'Indian Red Cross Society', type: 'NGO' },
    { name: 'National Blood Transfusion Council', type: 'Government' },
    { name: 'WHO Guidelines Certified', type: 'International' }
  ];

  const myths = [
    { myth: 'Donating blood makes you weak', fact: 'Your body replaces blood within 24-48 hours' },
    { myth: 'Donating spreads diseases', fact: 'Sterile equipment prevents any transmission' },
    { myth: 'Only O- blood is universal', fact: 'O- is universal donor, AB+ is universal recipient' },
    { myth: 'You can\'t donate if you have tattoos', fact: 'You can donate 6 months after getting a tattoo' }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">
            Your Safety & Trust Come First
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            BloodConnect follows international safety standards and works with verified partners to ensure every donation is safe and impactful.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Safety Rules */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Safety First Approach</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {safetyRules.map((rule, index) => (
                <motion.div
                  key={index}
                  className="bg-green-50 rounded-2xl p-4 border border-green-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <rule.icon className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-slate-900">{rule.title}</h4>
                  </div>
                  <p className="text-sm text-slate-600">{rule.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Eligibility Criteria */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Who Can Donate?</h3>
            </div>

            <div className="space-y-3">
              {eligibilityCriteria.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    item.eligible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {item.eligible ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    item.eligible ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {item.condition}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Final eligibility is determined by our medical team during your visit.
                Many factors are considered for your safety and the safety of recipients.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Government & NGO Associations */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Trusted Partnerships</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {associations.map((assoc, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-slate-900">{assoc.name}</span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    assoc.type === 'Government' ? 'bg-blue-100 text-blue-700' :
                    assoc.type === 'NGO' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {assoc.type}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Myths vs Facts */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Myths vs Facts</h3>
            </div>

            <div className="space-y-4">
              {myths.map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-orange-50 rounded-2xl p-4 border border-orange-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        <span className="text-orange-700">"Myth:"</span> {item.myth}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="text-green-700 font-medium">"Fact:"</span> {item.fact}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Trust Banner */}
        <motion.div
          className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Heart className="w-8 h-8 text-red-400" />
            <h3 className="text-2xl font-bold">Every Donation is Safe & Impactful</h3>
            <Heart className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            With over 150,000 successful donations facilitated and partnerships with leading healthcare institutions,
            BloodConnect ensures every contribution makes a real difference while prioritizing your safety.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>WHO Certified Protocols</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>500+ Verified Partners</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>250 Cities Covered</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustIndicators;
