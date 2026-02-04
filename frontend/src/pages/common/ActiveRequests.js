import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import StatusBadge from '../../components/common/StatusBadge';
import UrgencyIndicator from '../../components/common/UrgencyIndicator';
import RequestCard from '../../components/cards/RequestCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ActiveRequests = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, processing, partially_fulfilled, escalated, testing, issued, fulfilled, closed, expired

  useEffect(() => {
    loadRequests();
  }, [user, filter]);

  const loadRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let data;
      if (user.role === 'Hospital') {
        data = await requestService.getHospitalRequests();
        setRequests(data.requests || []);
      } else if (user.role === 'BloodBank') {
        data = await requestService.getBloodBankRequests();
        setRequests(data.requests || []);
      } else {
        // For other roles, show a message or empty state
        setRequests([]);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return requests;
    if (filter === 'closed') {
      return requests.filter((r) => r.status === 'cancelled' || r.status === 'expired');
    }
    return requests.filter((req) => req.status === filter);
  };

  // Get request pipeline stage info
  const getPipelineStage = (request) => {
    const status = request.status;
    if (status === 'pending') return { stage: 'Created', color: 'yellow' };
    if (status === 'processing') {
      if (request.fulfillmentDetails?.donorMobilization?.initiated) {
        return { stage: 'Donor Mobilization', color: 'blue' };
      }
      if (request.fulfillmentDetails?.collegeEscalation?.initiated) {
        return { stage: 'Escalated', color: 'orange' };
      }
      return { stage: 'Processing', color: 'blue' };
    }
    if (status === 'partially_fulfilled') return { stage: 'Partially Fulfilled', color: 'orange' };
    if (status === 'fulfilled') return { stage: 'Fulfilled', color: 'green' };
    if (status === 'cancelled') return { stage: 'Cancelled', color: 'gray' };
    if (status === 'expired') return { stage: 'Expired', color: 'gray' };
    return { stage: status, color: 'gray' };
  };

  const getRequestActions = (request) => {
    const actions = [];
    const pipelineStage = getPipelineStage(request);

    if (user?.role === 'Hospital') {
      if (request.status === 'pending' || request.status === 'processing' || request.status === 'partially_fulfilled') {
        actions.push(
          <Link
            key="view"
            to={`/hospital/requests/${request._id}`}
            className="btn-secondary text-sm py-2"
          >
            View Details
          </Link>
        );
      }
      if (request.status === 'pending' || request.status === 'processing') {
        actions.push(
          <Link
            key="escalate"
            to={`/hospital/requests/${request._id}?action=escalate`}
            className="bg-warning-500 text-white px-4 py-2 rounded-2xl text-sm font-medium hover:bg-warning-600 transition-all duration-200 active:scale-95 shadow-soft hover:shadow-soft-lg"
          >
            Escalate
          </Link>
        );
      }
      if (request.status === 'pending' || request.status === 'processing') {
        actions.push(
          <button
            key="close"
            onClick={() => {/* Handle close */}}
            className="text-slate-600 hover:text-slate-900 px-4 py-2 rounded-2xl text-sm font-medium hover:bg-slate-100 transition-all duration-200 active:scale-95"
          >
            Close
          </button>
        );
      }
    } else if (user?.role === 'BloodBank') {
      if (request.status === 'pending' || request.status === 'processing') {
        actions.push(
          <Link
            key="fulfill"
            to={`/bloodbank/requests/${request._id}`}
            className="btn-primary text-sm py-2"
          >
            Commit Units
          </Link>
        );
      }
    } else if (user?.role === 'Donor') {
      if (pipelineStage.stage === 'Donor Mobilization' && request.status === 'processing') {
        actions.push(
          <Link
            key="accept"
            to={`/requests/${request._id}?action=accept`}
            className="btn-primary text-sm py-2"
          >
            Accept
          </Link>
        );
      }
    } else if (user?.role === 'College') {
      if (pipelineStage.stage === 'Escalated' && request.status === 'processing') {
        actions.push(
          <Link
            key="mobilize"
            to={`/college/dashboard?request=${request._id}`}
            className="btn-primary text-sm py-2"
          >
            Approve Drive
          </Link>
        );
      }
    } else if (user?.role === 'Admin') {
      actions.push(
        <Link
          key="audit"
          to={`/admin/audit-logs?request=${request._id}`}
          className="btn-secondary text-sm py-2"
        >
          Audit
        </Link>
      );
      if (request.status !== 'fulfilled' && request.status !== 'cancelled' && request.status !== 'expired') {
        actions.push(
          <button
            key="force-resolve"
            onClick={() => {/* Handle force resolve */}}
            className="text-emergency hover:bg-emergency/10 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-95"
          >
            Force Resolve
          </button>
        );
      }
    }

    return actions;
  };

  const getEmptyMessage = () => {
    if (user?.role === 'Hospital') {
      return 'You haven\'t created any requests yet. Create your first blood request to get started.';
    } else if (user?.role === 'BloodBank') {
      return 'No requests assigned to your blood bank at the moment.';
    }
    return 'No active requests available for your role.';
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Active Requests</h1>
          <p className="text-slate-600 mt-1.5">
            {user?.role === 'Hospital'
              ? 'Track your blood requests'
              : user?.role === 'BloodBank'
              ? 'Requests assigned to your blood bank'
              : 'View active blood requests'}
          </p>
        </div>
        {(user?.role === 'Hospital' || user?.role === 'Admin') && (
          <Link
            to="/requests/create"
            className="btn-primary whitespace-nowrap"
          >
            + Create Request
          </Link>
        )}
      </div>

      {/* Unified Pipeline Filters */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Request Pipeline</h3>
          <p className="text-xs text-slate-500">View requests across all stages of the fulfillment process</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
              filter === 'all'
                ? 'bg-primary-500 text-white shadow-soft'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
              filter === 'pending'
                ? 'bg-warning-500 text-white shadow-soft'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Created ({requests.filter((r) => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('processing')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
              filter === 'processing'
                ? 'bg-primary-500 text-white shadow-soft'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Processing ({requests.filter((r) => r.status === 'processing').length})
          </button>
          <button
            onClick={() => setFilter('partially_fulfilled')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
              filter === 'partially_fulfilled'
                ? 'bg-coral-500 text-white shadow-soft'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Partially Fulfilled ({requests.filter((r) => r.status === 'partially_fulfilled').length})
          </button>
          <button
            onClick={() => setFilter('fulfilled')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
              filter === 'fulfilled'
                ? 'bg-success-500 text-white shadow-soft'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Fulfilled ({requests.filter((r) => r.status === 'fulfilled').length})
          </button>
          {(requests.filter((r) => r.status === 'cancelled' || r.status === 'expired').length > 0) && (
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
                filter === 'closed'
                  ? 'bg-slate-600 text-white shadow-soft'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Closed ({requests.filter((r) => r.status === 'cancelled' || r.status === 'expired').length})
            </button>
          )}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-600 text-lg mb-6 font-medium">{getEmptyMessage()}</p>
          {(user?.role === 'Hospital' || user?.role === 'Admin') && (
            <Link
              to="/requests/create"
              className="btn-primary inline-block"
            >
              Create Your First Request
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              actions={getRequestActions(request)}
              getPipelineStage={getPipelineStage}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveRequests;

