import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBloodBankRequests } from '../../store/slices/requestSlice';
import { requestService } from '../../services/requestService';
import StatusBadge from '../../components/common/StatusBadge';
import UrgencyIndicator from '../../components/common/UrgencyIndicator';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const AssignedRequests = () => {
  const dispatch = useDispatch();
  const { bloodBankRequests, loading } = useSelector((state) => state.requests);

  useEffect(() => {
    dispatch(fetchBloodBankRequests());
  }, [dispatch]);

  const handleFulfill = async (requestId, units) => {
    try {
      await requestService.fulfillRequest(requestId, units);
      toast.success('Request fulfilled successfully');
      dispatch(fetchBloodBankRequests());
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fulfill request');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Assigned Requests</h1>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Blood Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bloodBankRequests.map((request) => (
                  <tr key={request._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.bloodGroup}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.units}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UrgencyIndicator urgency={request.urgency} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleFulfill(request._id, request.units)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Fulfill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedRequests;

