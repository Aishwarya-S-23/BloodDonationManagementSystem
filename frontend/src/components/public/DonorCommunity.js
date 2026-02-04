import React from 'react';
import { Globe, Award, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

const SectionHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shadow-soft">
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-2xl font-display font-bold text-slate-900">{title}</h3>
  </div>
);

const DonorCommunity = () => {
  const topCities = [
    { id: 1, name: 'Mumbai', contributions: '15,000+ donations' },
    { id: 2, name: 'Delhi', contributions: '12,500+ donations' },
    { id: 3, name: 'Bangalore', contributions: '10,000+ donations' },
    { id: 4, name: 'Chennai', contributions: '8,000+ donations' },
  ];

  const monthlyHighlights = [
    { id: 1, name: 'Priya Sharma', achievement: 'Made her 50th donation!', city: 'Pune' },
    { id: 2, name: 'Rajesh Kumar', achievement: 'Organized a successful blood drive.', city: 'Hyderabad' },
    { id: 3, name: 'Anjali Singh', achievement: 'Recruited 10 new donors.', city: 'Kolkata' },
  ];

  const colleges = [
    { id: 1, name: 'IIT Bombay', participation: 'Active drives & awareness campaigns' },
    { id: 2, name: 'Delhi University', participation: 'Consistent student donor base' },
    { id: 3, name: 'BITS Pilani', participation: 'Innovative campus blood donation events' },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-16 bg-beige-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-display font-bold text-center text-slate-900 mb-12">
          Our Vibrant Donor Community
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Top Contributing Cities */}
          <div>
            <SectionHeader title="Top Contributing Cities" icon={Globe} />
            <div className="space-y-4">
              {topCities.map((city, index) => (
                <motion.div
                  key={city.id}
                  className="card p-4 flex items-center justify-between"
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div>
                    <h4 className="font-semibold text-lg text-slate-900">{city.name}</h4>
                    <p className="text-sm text-slate-500">{city.contributions}</p>
                  </div>
                  <span className="text-primary-600 font-bold text-xl">#{index + 1}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Monthly Donor Highlights */}
          <div>
            <SectionHeader title="Monthly Donor Highlights" icon={Award} />
            <div className="space-y-4">
              {monthlyHighlights.map((donor, index) => (
                <motion.div
                  key={donor.id}
                  className="card p-4"
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h4 className="font-semibold text-lg text-slate-900">{donor.name}</h4>
                  <p className="text-sm text-slate-600 mb-1">{donor.achievement}</p>
                  <p className="text-xs text-slate-500">from {donor.city}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Colleges Actively Participating */}
          <div>
            <SectionHeader title="Colleges Actively Participating" icon={GraduationCap} />
            <div className="space-y-4">
              {colleges.map((college, index) => (
                <motion.div
                  key={college.id}
                  className="card p-4"
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h4 className="font-semibold text-lg text-slate-900">{college.name}</h4>
                  <p className="text-sm text-slate-600">{college.participation}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonorCommunity;

