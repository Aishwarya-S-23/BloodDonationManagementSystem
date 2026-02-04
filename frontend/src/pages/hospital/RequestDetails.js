import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRequestDetails, cancelRequest } from '../../store/slices/requestSlice';
import { openModal } from '../../store/slices/uiSlice';
import StatusBadge from '../../components/common/StatusBadge';
import UrgencyIndicator from '../../components/common/UrgencyIndicator';
import Timeline from '../../components/common/Timeline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentRequest, loading } = useSelector((state) => state.requests);

  useEffect(() => {
    dispatch(fetchRequestDetails(id));
  }, [id, dispatch]);

  const handleCancel = () => {
    dispatch(
      openModal({
        type: 'cancelRequest',
        data: {
          onConfirm: async () => {
            try {
              await dispatch(cancelRequest(id)).unwrap();
              toast.success('Request cancelled successfully');
              navigate('/hospital/dashboard');
            } catch (error) {
              toast.error(error || 'Failed to cancel request');
            }
          },
        },
      })
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentRequest) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Request not found</p>
      </div>
    );
  }

  const timelineEvents = [
    {
      title: 'Request Created',
      timestamp: currentRequest.createdAt,
      description: 'Blood request was created',
      status: 'pending',
    },
    ...(currentRequest.fulfillmentDetails?.assignedBloodBanks || []).map((bank) => ({
      title: `Assigned to Blood Bank`,
      timestamp: new Date(),
      description: `${bank.units} units assigned`,
      status: bank.status,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
        {currentRequest.status !== 'fulfilled' && currentRequest.status !== 'cancelled' && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Cancel Request
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Blood Group</label>
                <p className="text-lg font-semibold text-gray-900">{currentRequest.bloodGroup}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Component</label>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {currentRequest.component.replace('_', ' ')}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Units Required</label>
                <p className="text-lg font-semibold text-gray-900">{currentRequest.units}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <p className="mt-1">
                  <StatusBadge status={currentRequest.status} />
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Urgency</label>
                <p className="mt-1">
                  <UrgencyIndicator urgency={currentRequest.urgency} />
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Deadline</label>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(currentRequest.deadline), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
            {currentRequest.notes && (
              <div className="mt-4">
                <label className="text-sm text-gray-600">Notes</label>
                <p className="text-gray-900 mt-1">{currentRequest.notes}</p>
              </div>
            )}
          </div>

          {/* Fulfillment Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Fulfillment Status</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Fulfilled Units</label>
                <p className="text-2xl font-bold text-gray-900">
                  {currentRequest.fulfillmentDetails?.fulfilledUnits || 0} / {currentRequest.units}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-primary-600 h-4 rounded-full"
                  style={{
                    width: `${
                      ((currentRequest.fulfillmentDetails?.fulfilledUnits || 0) /
                        currentRequest.units) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
            <Timeline events={timelineEvents} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                View Blood Banks
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;

