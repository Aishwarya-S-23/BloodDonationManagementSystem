import React from 'react';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const images = [
  { id: 1, src: '/images/story-1.jpg', alt: 'Donation drive event', story: '"Seeing the community come together was truly inspiring." - Volunteer, Mumbai', source: 'Verified Event' },
  { id: 2, src: '/images/story-2.jpg', alt: 'College campaign activity', story: '"Our campus actively participates to make a difference." - Student Coordinator, DU', source: 'Verified Campaign' },
  { id: 3, src: '/images/story-3.jpg', alt: 'Blood bank operations', story: '"Every unit processed is a step towards saving a life." - Lab Technician, City Hospital', source: 'Verified Operation' },
  { id: 4, src: '/images/story-4.jpg', alt: 'Blood donor smiling', story: '"It\'s a small act with a huge impact." - Regular Donor, Bangalore', source: 'Verified Donor' },
];

const VisualStorytelling = () => {
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <section className="py-16 bg-beige-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-display font-bold text-center text-slate-900 mb-12">
          Stories of Impact
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {images.map((item, index) => (
            <motion.div
              key={item.id}
              className="relative rounded-3xl overflow-hidden shadow-soft group cursor-pointer"
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent p-6 flex flex-col justify-end text-white">
                <p className="text-lg font-medium mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.story}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary-600 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <CheckCircle className="w-3 h-3" /> {item.source}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisualStorytelling;

