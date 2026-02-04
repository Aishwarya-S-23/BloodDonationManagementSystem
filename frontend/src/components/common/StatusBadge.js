const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      // Request statuses
      pending: { color: 'badge-pending', label: 'Pending' },
      processing: { color: 'bg-primary-100 text-primary-700', label: 'Processing' },
      partially_fulfilled: { color: 'bg-warning-100 text-warning-700', label: 'Partially Fulfilled' },
      fulfilled: { color: 'badge-fulfilled', label: 'Fulfilled' },
      cancelled: { color: 'bg-slate-100 text-slate-700', label: 'Cancelled' },
      expired: { color: 'bg-slate-200 text-slate-800', label: 'Expired' },
      
      // Donation statuses
      scheduled: { color: 'bg-primary-100 text-primary-700', label: 'Scheduled' },
      completed: { color: 'badge-fulfilled', label: 'Completed' },
      tested: { color: 'bg-rose-100 text-rose-700', label: 'Tested' },
      issued: { color: 'badge-fulfilled', label: 'Issued' },
      discarded: { color: 'bg-slate-200 text-slate-800', label: 'Discarded' },
      
      // Testing statuses
      passed: { color: 'badge-fulfilled', label: 'Passed' },
      failed: { color: 'bg-emergency/10 text-emergency border border-emergency/20', label: 'Failed' },
      in_progress: { color: 'badge-pending', label: 'In Progress' },
      
      // Inventory statuses
      available: { color: 'badge-fulfilled', label: 'Available' },
      reserved: { color: 'badge-pending', label: 'Reserved' },
      
      // Appointment statuses
      confirmed: { color: 'badge-fulfilled', label: 'Confirmed' },
      no_show: { color: 'bg-slate-200 text-slate-800', label: 'No Show' },
    };

    return configs[status] || { color: 'bg-slate-100 text-slate-700', label: status };
  };

  const config = getStatusConfig(status);

  return (
    <span className={`badge ${config.color}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
