import { format } from 'date-fns';
import StatusBadge from './StatusBadge';

const Timeline = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No timeline events available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={index} className="relative flex items-start">
            <div className="absolute left-3 w-3 h-3 bg-primary-600 rounded-full border-2 border-white"></div>
            <div className="ml-8 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                <span className="text-xs text-gray-500">
                  {event.timestamp ? format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm') : ''}
                </span>
              </div>
              {event.description && (
                <p className="mt-1 text-sm text-gray-600">{event.description}</p>
              )}
              {event.status && (
                <span className="mt-2 inline-block">
                  <StatusBadge status={event.status} />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;

