import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { HeartHandshake, Users, Globe, Droplet } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, delay }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const spring = useSpring({
    from: { number: 0 },
    to: { number: isInView ? value : 0 },
    config: { mass: 1, tension: 20, friction: 10 },
    delay: delay,
  });

  return (
    <motion.div
      ref={ref}
      className="card flex flex-col items-center justify-center p-6 text-center"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: delay / 1000 }}
    >
      <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mb-4 shadow-inner-soft">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
        <animated.span>{spring.number.to(n => n.toFixed(0))}</animated.span>{title === "Total Donations Facilitated" ? "+" : ""}
      </h3>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
    </motion.div>
  );
};

const ImpactMetrics = () => {
  const metrics = [
    { id: 1, icon: Droplet, title: 'Total Donations Facilitated', value: 150000, delay: 0 },
    { id: 2, icon: HeartHandshake, title: 'Estimated Lives Impacted', value: 450000, delay: 200 },
    { id: 3, icon: Users, title: 'Active Donor Community', value: 75000, delay: 400 },
    { id: 4, icon: Globe, title: 'Cities Currently Covered', value: 250, delay: 600 },
  ];

  return (
    <section className="py-16 bg-beige-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-display font-bold text-center text-slate-900 mb-12">
          Our Impact in Numbers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric) => (
            <StatCard key={metric.id} {...metric} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactMetrics;

