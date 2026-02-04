import StatusBadge from '../common/StatusBadge';
import UrgencyIndicator from '../common/UrgencyIndicator';

const RequestCard = ({ request, actions, getPipelineStage }) => {
  const getUrgencyClass = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'card-urgency-critical';
      case 'high':
        return 'card-urgency-high';
      case 'medium':
        return 'card-urgency-medium';
      default:
        return 'card-urgency-low';
    }
  };

  const deadlineDate = new Date(request.deadline || request.requiredBy);
  const isUrgent = deadlineDate < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <div className={`card ${getUrgencyClass(request.urgency)} hover:shadow-soft-lg transition-all duration-300`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Header with Blood Group and Badges */}
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl font-display font-semibold text-slate-900">
                {request.bloodGroup}
                {request.component && request.component !== 'Whole Blood' && (
                  <span className="text-base font-normal text-slate-600 ml-1">· {request.component}</span>
                )}
              </h3>
              <StatusBadge status={request.status} />
              <UrgencyIndicator urgency={request.urgency} />
              {getPipelineStage && (
                <span className="badge bg-slate-100 text-slate-700">
                  {getPipelineStage(request).stage}
                </span>
              )}
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Units</div>
              <div className="text-base font-semibold text-slate-900">
                {request.units}
                {request.fulfillmentDetails?.fulfilledUnits > 0 && (
                  <span className="text-success-600 text-sm font-normal ml-2">
                    ({request.fulfillmentDetails.fulfilledUnits} fulfilled)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Deadline</div>
              <div className={`text-base font-semibold ${isUrgent ? 'text-emergency' : 'text-slate-900'}`}>
                {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              {isUrgent && (
                <div className="text-xs text-emergency font-medium">Urgent</div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</div>
              <div className="text-base font-medium text-slate-700">
                {request.hospitalId && typeof request.hospitalId === 'object'
                  ? request.hospitalId.address?.city || 'Unknown'
                  : 'Unknown'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Request ID</div>
              <div className="text-sm font-mono text-slate-600">{request._id.slice(-8)}</div>
            </div>
          </div>

          {/* Additional Details */}
          {(request.hospitalId || request.patientDetails) && (
            <div className="flex flex-wrap gap-4 text-sm mb-4 pt-4 border-t border-slate-100">
              {request.hospitalId && typeof request.hospitalId === 'object' && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-slate-600">
                    <span className="font-medium">{request.hospitalId.name}</span>
                  </span>
                </div>
              )}
              {request.patientDetails && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-slate-600">
                    <span className="font-medium">{request.patientDetails.name}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {request.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {request.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCard;

