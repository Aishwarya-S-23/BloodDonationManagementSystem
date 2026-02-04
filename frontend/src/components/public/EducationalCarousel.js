import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Syringe, CalendarDays, BrainCircuit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const carouselItems = [
  {
    id: 1,
    icon: HeartPulse,
    title: 'How blood donation saves lives',
    description: 'Your single donation can save up to three lives, providing critical support for surgeries, accidents, and chronic illnesses.',
    illustration: '/images/save-lives.jpg', // Placeholder image
  },
  {
    id: 2,
    icon: Syringe,
    title: 'What happens after you donate?',
    description: "Your blood goes through rigorous testing, processing, and is then stored safely until it's needed by a patient.",
    illustration: '/images/after-donate.jpg', // Placeholder image
  },
  {
    id: 3,
    icon: CalendarDays,
    title: 'Who can donate & when?',
    description: 'Most healthy adults aged 18-65, weighing over 50kg, can donate. You can typically donate every 3 months.',
    illustration: '/images/who-can-donate.jpg', // Placeholder image
  },
  {
    id: 4,
    icon: BrainCircuit,
    title: 'Myths vs Facts',
    description: 'Separate fact from fiction about blood donation. Learn the truth and debunk common misconceptions.',
    illustration: '/images/myths-facts.jpg', // Placeholder image
  },
];

const EducationalCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? carouselItems.length - 1 : prevIndex - 1
    );
  };

  const currentItem = carouselItems[currentIndex];

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <section className="py-16 bg-beige-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-display font-bold text-center text-slate-900 mb-12">
          Educate Yourself About Donation
        </h2>
        <div className="relative">
          <AnimatePresence initial={false} custom={currentIndex}>
            <motion.div
              key={currentIndex}
              custom={currentIndex}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="card p-8 flex flex-col md:flex-row items-center gap-8 bg-white shadow-lg rounded-3xl"
            >
              <div className="flex-shrink-0">
                <img
                  src={currentItem.illustration}
                  alt={currentItem.title}
                  className="w-full md:w-64 h-48 md:h-64 object-cover rounded-2xl shadow-soft"
                />
              </div>
              <div className="text-center md:text-left">
                <div className="w-16 h-16 mx-auto md:mx-0 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mb-4 shadow-inner-soft">
                  <currentItem.icon className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-display font-bold text-slate-900 mb-4">
                  {currentItem.title}
                </h3>
                <p className="text-lg text-slate-600 mb-6">
                  {currentItem.description}
                </p>
                <Link to="#" className="btn-secondary">
                  Learn More
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-soft hover:bg-white/90 transition-colors duration-200 z-20"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <button
            onClick={handleNext}
            className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-soft hover:bg-white/90 transition-colors duration-200 z-20"
          >
            <ChevronRight className="w-6 h-6 text-slate-700" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                index === currentIndex ? 'bg-primary-500' : 'bg-slate-300 hover:bg-slate-400'
              }`}
            ></button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EducationalCarousel;

