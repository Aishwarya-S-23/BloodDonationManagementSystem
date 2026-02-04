import { useState } from 'react';

const MapLayerToggle = ({ 
  activeLayers = ['bloodBank', 'hospital', 'donationCamp'], 
  onToggle,
  className = '' 
}) => {
  const [layers, setLayers] = useState({
    bloodBank: activeLayers.includes('bloodBank'),
    hospital: activeLayers.includes('hospital'),
    donationCamp: activeLayers.includes('donationCamp'),
    emergencyZones: activeLayers.includes('emergencyZones'),
    donorDensity: activeLayers.includes('donorDensity'),
    emergencyRequests: activeLayers.includes('emergencyRequests'),
  });

  const layerConfig = [
    {
      id: 'bloodBank',
      label: 'Blood Banks',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5z" />
        </svg>
      ),
      color: '#dc2626',
    },
    {
      id: 'hospital',
      label: 'Hospitals',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
      color: '#059669',
    },
    {
      id: 'donationCamp',
      label: 'Donation Camps',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      color: '#2563eb',
    },
    {
      id: 'emergencyZones',
      label: 'Emergency Areas',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      color: '#dc2626',
    },
    {
      id: 'donorDensity',
      label: 'Donor Density',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      ),
      color: '#166534',
    },
    {
      id: 'emergencyRequests',
      label: 'Active Requests',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
      ),
      color: '#7c2d12',
    },
  ];

  const handleToggle = (layerId) => {
    const newLayers = {
      ...layers,
      [layerId]: !layers[layerId],
    };
    setLayers(newLayers);
    
    // Call parent callback with active layers
    const activeLayerIds = Object.keys(newLayers).filter(key => newLayers[key]);
    if (onToggle) {
      onToggle(activeLayerIds);
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow-soft p-3 space-y-2 ${className}`}
      role="group"
      aria-label="Map layer toggles"
    >
      <div className="text-xs font-semibold text-slate-700 mb-2 px-1">Show on Map</div>
      {layerConfig.map((layer) => {
        const isActive = layers[layer.id];
        return (
          <button
            key={layer.id}
            type="button"
            onClick={() => handleToggle(layer.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle(layer.id);
              }
            }}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-xl
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
              ${isActive 
                ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }
            `}
            aria-pressed={isActive}
            aria-label={`${isActive ? 'Hide' : 'Show'} ${layer.label}`}
            tabIndex={0}
          >
            <div 
              className={`
                flex items-center justify-center w-5 h-5 rounded-full
                transition-all duration-300
                ${isActive ? 'scale-110' : 'scale-100'}
              `}
              style={{ 
                backgroundColor: isActive ? layer.color : 'transparent',
                border: `2px solid ${isActive ? layer.color : '#cbd5e1'}`,
              }}
            >
              <div className="text-white" style={{ color: isActive ? 'white' : layer.color }}>
                {layer.icon}
              </div>
            </div>
            <span className="text-sm font-medium flex-1 text-left">{layer.label}</span>
            {isActive && (
              <svg 
                className="w-4 h-4 text-primary-600 transition-opacity duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MapLayerToggle;
