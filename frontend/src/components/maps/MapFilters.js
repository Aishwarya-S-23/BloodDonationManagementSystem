import { useState } from 'react';

const MapFilters = ({ 
  onApply, 
  initialRadius = 50,
  initialBloodGroups = [],
  className = '' 
}) => {
  const [radius, setRadius] = useState(initialRadius);
  const [selectedBloodGroups, setSelectedBloodGroups] = useState(initialBloodGroups);
  const [isOpen, setIsOpen] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const radiusOptions = [5, 10, 25, 50, 100];

  const handleBloodGroupToggle = (group) => {
    setSelectedBloodGroups((prev) => {
      if (prev.includes(group)) {
        return prev.filter((g) => g !== group);
      }
      return [...prev, group];
    });
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        radius,
        bloodGroups: selectedBloodGroups,
      });
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    setRadius(50);
    setSelectedBloodGroups([]);
    if (onApply) {
      onApply({
        radius: 50,
        bloodGroups: [],
      });
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          bg-white rounded-2xl shadow-soft px-4 py-2.5
          flex items-center gap-2
          transition-all duration-300 ease-out
          hover:shadow-soft-lg focus:outline-none focus:ring-2 
          focus:ring-primary-500/50 focus:ring-offset-2
          border border-slate-200
          ${isOpen ? 'bg-primary-50 border-primary-200' : ''}
        `}
        aria-expanded={isOpen}
        aria-label="Open map filters"
        aria-haspopup="true"
        tabIndex={0}
      >
        <svg 
          className="w-5 h-5 text-slate-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="text-sm font-medium text-slate-700">Filters</span>
        {isOpen && (
          <svg 
            className="w-4 h-4 text-slate-600 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </button>

      {/* Filters Panel */}
      {isOpen && (
        <div 
          className={`
            absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-soft-lg
            p-4 w-80 z-50 border border-slate-200
            transition-all duration-300 ease-out
            ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
          `}
          role="dialog"
          aria-label="Map filters"
        >
          {/* Distance Radius */}
          <div className="mb-4">
            <label 
              className="block text-sm font-semibold text-slate-700 mb-2"
              htmlFor="radius-filter"
            >
              Distance Radius
            </label>
            <div className="flex flex-wrap gap-2">
              {radiusOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRadius(option)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setRadius(option);
                    }
                  }}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-all duration-200 ease-out
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-1
                    ${radius === option
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }
                  `}
                  aria-pressed={radius === option}
                  aria-label={`Set radius to ${option} kilometers`}
                  tabIndex={0}
                >
                  {option} km
                </button>
              ))}
            </div>
          </div>

          {/* Blood Group Filter */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Blood Groups
            </label>
            <div className="flex flex-wrap gap-2">
              {bloodGroups.map((group) => {
                const isSelected = selectedBloodGroups.includes(group);
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => handleBloodGroupToggle(group)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleBloodGroupToggle(group);
                      }
                    }}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium
                      transition-all duration-200 ease-out
                      focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-1
                      ${isSelected
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }
                    `}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} blood group ${group}`}
                    tabIndex={0}
                  >
                    {group}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="
                flex-1 px-4 py-2 rounded-xl text-sm font-medium
                bg-slate-100 text-slate-700
                hover:bg-slate-200
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1
              "
              aria-label="Reset filters"
              tabIndex={0}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="
                flex-1 px-4 py-2 rounded-xl text-sm font-medium
                bg-primary-500 text-white
                hover:bg-primary-600
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-1
                shadow-sm
              "
              aria-label="Apply filters"
              tabIndex={0}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapFilters;
