const UrgencyIndicator = ({ urgency }) => {
  const getUrgencyConfig = (urgency) => {
    const configs = {
      low: {
        color: 'bg-success-100 text-success-700 border-success-300',
        label: 'Low',
        dot: 'bg-success-500',
      },
      medium: {
        color: 'bg-warning-100 text-warning-700 border-warning-300',
        label: 'Medium',
        dot: 'bg-warning-500',
      },
      high: {
        color: 'bg-coral-100 text-coral-700 border-coral-300',
        label: 'High',
        dot: 'bg-coral-500',
      },
      critical: {
        color: 'badge-critical',
        label: 'Critical',
        dot: 'bg-emergency',
        pulse: 'animate-pulse-emergency',
      },
    };

    return configs[urgency] || configs.medium;
  };

  const config = getUrgencyConfig(urgency);

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold text-xs ${config.color} ${config.pulse || ''}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot} ${config.pulse || ''}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default UrgencyIndicator;
