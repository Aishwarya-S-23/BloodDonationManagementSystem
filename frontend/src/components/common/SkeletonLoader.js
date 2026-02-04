const SkeletonLoader = ({ type = 'card', count = 1, className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-white rounded-3xl shadow-soft p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-soft p-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'map':
        return (
          <div className="h-96 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 animate-pulse">
            <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200"></div>
          </div>
        );
      
      case 'text':
        return (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-4/6"></div>
          </div>
        );
      
      case 'facility':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-slate-200 rounded w-20"></div>
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className="bg-slate-200 rounded animate-pulse h-20 w-full"></div>
        );
    }
  };

  if (type === 'list' || type === 'facility') {
    return renderSkeleton();
  }

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
