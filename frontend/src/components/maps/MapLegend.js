const MapLegend = ({ className = '' }) => {
  const legendItems = [
    {
      type: 'bloodBank',
      label: 'Blood Bank',
      color: '#dc2626',
      icon: (
        <div 
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: '#dc2626' }}
          aria-hidden="true"
        />
      ),
    },
    {
      type: 'hospital',
      label: 'Hospital',
      color: '#059669',
      icon: (
        <div 
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: '#059669' }}
          aria-hidden="true"
        />
      ),
    },
    {
      type: 'donationCamp',
      label: 'Donation Camp',
      color: '#2563eb',
      icon: (
        <div 
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: '#2563eb' }}
          aria-hidden="true"
        />
      ),
    },
    {
      type: 'userLocation',
      label: 'Your Location',
      color: '#D06570',
      icon: (
        <div
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
          style={{ backgroundColor: '#D06570' }}
          aria-hidden="true"
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      ),
    },
    {
      type: 'emergencyZone',
      label: 'Emergency Areas',
      color: '#dc2626',
      icon: (
        <div className="relative">
          <div
            className="w-4 h-4 rounded-full border-2 border-dashed border-red-500 opacity-60"
            style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)' }}
            aria-hidden="true"
          />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      ),
    },
    {
      type: 'donorDensity',
      label: 'Donor Density',
      color: '#166534',
      icon: (
        <div className="relative">
          <div
            className="w-4 h-4 rounded-full border-2 border-dashed border-green-600 opacity-60"
            style={{ backgroundColor: 'rgba(22, 101, 52, 0.2)' }}
            aria-hidden="true"
          />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-600 rounded-full" />
        </div>
      ),
    },
    {
      type: 'emergencyRequest',
      label: 'Active Requests',
      color: '#7c2d12',
      icon: (
        <div className="relative">
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow-lg animate-pulse"
            style={{ backgroundColor: '#dc2626' }}
            aria-hidden="true"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse" />
        </div>
      ),
    },
  ];

  return (
    <div 
      className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-soft p-4 border border-slate-200/80 ${className}`}
      role="region"
      aria-label="Map legend"
    >
      <h3 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">
        Legend
      </h3>
      <div className="space-y-2">
        {legendItems.map((item) => (
          <div 
            key={item.type}
            className="flex items-center gap-2.5"
            role="listitem"
          >
            <div className="flex-shrink-0" aria-hidden="true">
              {item.icon}
            </div>
            <span className="text-sm text-slate-700 font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapLegend;
