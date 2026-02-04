import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { bloodBankService } from '../../services/bloodBankService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const TestingWorkflow = () => {
  const { user } = useSelector(state => state.auth);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTestForm, setShowTestForm] = useState(false);
  const [filter, setFilter] = useState({
    status: 'completed', // Show completed donations ready for testing
    dateRange: '7', // Last 7 days
  });

  const [testResults, setTestResults] = useState({
    hiv: 'pending',
    hepatitisB: 'pending',
    hepatitisC: 'pending',
    syphilis: 'pending',
    malaria: 'pending',
  });

  useEffect(() => {
    loadDonations();
  }, [filter]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const params = {
        status: filter.status,
        limit: 50,
      };

      if (filter.dateRange) {
        const days = parseInt(filter.dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.startDate = startDate.toISOString();
      }

      const response = await bloodBankService.getDonations(params);
      setDonations(response.donations || []);
    } catch (error) {
      console.error('Error loading donations:', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const handleTestResults = async (e) => {
    e.preventDefault();

    try {
      await bloodBankService.recordTestResults(selectedDonation._id, testResults);

      toast.success('Test results recorded successfully');

      // Reset form
      setTestResults({
        hiv: 'pending',
        hepatitisB: 'pending',
        hepatitisC: 'pending',
        syphilis: 'pending',
        malaria: 'pending',
      });

      setShowTestForm(false);
      setSelectedDonation(null);
      loadDonations();
    } catch (error) {
      toast.error('Failed to record test results');
    }
  };

  const handleIssueBlood = async (donationId) => {
    try {
      await bloodBankService.issueBlood(donationId);
      toast.success('Blood issued successfully');
      loadDonations();
    } catch (error) {
      toast.error('Failed to issue blood');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      tested: 'bg-purple-100 text-purple-800',
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      issued: 'bg-indigo-100 text-indigo-800',
      discarded: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTestingStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTestResultColor = (result) => {
    const colors = {
      negative: 'text-green-600',
      positive: 'text-red-600',
      pending: 'text-yellow-600',
    };
    return colors[result] || 'text-gray-600';
  };

  const getTestResultIcon = (result) => {
    const icons = {
      negative: '✅',
      positive: '❌',
      pending: '⏳',
    };
    return icons[result] || '❓';
  };

  const filteredDonations = donations.filter(donation => {
    if (filter.status && donation.status !== filter.status) return false;
    return true;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Testing & Clearance Workflow</h1>
          <p className="text-gray-600 mt-1">Manage blood testing, clearance, and issuance process</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Pending Tests</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">
            {donations.filter(d => d.testingStatus === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Tests Passed</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {donations.filter(d => d.testingStatus === 'passed').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Tests Failed</div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            {donations.filter(d => d.testingStatus === 'failed').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Blood Issued</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {donations.filter(d => d.status === 'issued').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({...filter, status: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="completed">Completed (Ready for Testing)</option>
            <option value="tested">Tested</option>
            <option value="issued">Issued</option>
            <option value="discarded">Discarded</option>
          </select>

          <select
            value={filter.dateRange}
            onChange={(e) => setFilter({...filter, dateRange: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <button
            onClick={loadDonations}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Donations ({filteredDonations.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blood Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Testing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonations.map((donation) => (
                <tr key={donation._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">
                        {donation.donorId ? `${donation.donorId.firstName || ''} ${donation.donorId.lastName || ''}`.trim() || 'Unknown' : 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {donation.donorId?._id?.slice(-6) || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-red-600">{donation.bloodGroup}</span>
                    <span className="text-gray-500 ml-2 capitalize">
                      {donation.component.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(donation.donationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(donation.status)}`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTestingStatusColor(donation.testingStatus)}`}>
                      {donation.testingStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {donation.status === 'completed' && donation.testingStatus === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedDonation(donation);
                          setShowTestForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Record Tests
                      </button>
                    )}
                    {donation.testingStatus === 'passed' && donation.status !== 'issued' && (
                      <button
                        onClick={() => handleIssueBlood(donation._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Issue Blood
                      </button>
                    )}
                    <button className="text-gray-600 hover:text-gray-900 ml-3">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDonations.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">🧪</span>
            <h3 className="text-lg font-medium text-gray-900 mt-4">No donations found</h3>
            <p className="text-gray-600 mt-2">Adjust your filters or check back later for new donations</p>
          </div>
        )}
      </div>

      {/* Testing Form Modal */}
      {showTestForm && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Record Test Results</h2>
                <button
                  onClick={() => {
                    setShowTestForm(false);
                    setSelectedDonation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Donation Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3">Donation Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Blood Group:</span>
                    <span className="font-medium text-red-600 ml-2">{selectedDonation.bloodGroup}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Component:</span>
                    <span className="font-medium ml-2 capitalize">
                      {selectedDonation.component.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Units:</span>
                    <span className="font-medium ml-2">{selectedDonation.units}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium ml-2">
                      {new Date(selectedDonation.donationDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleTestResults} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Mandatory Test Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* HIV Test */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        HIV Test <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={testResults.hiv}
                        onChange={(e) => setTestResults({...testResults, hiv: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="pending">Pending</option>
                        <option value="negative">Negative</option>
                        <option value="positive">Positive</option>
                      </select>
                    </div>

                    {/* Hepatitis B */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hepatitis B <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={testResults.hepatitisB}
                        onChange={(e) => setTestResults({...testResults, hepatitisB: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="pending">Pending</option>
                        <option value="negative">Negative</option>
                        <option value="positive">Positive</option>
                      </select>
                    </div>

                    {/* Hepatitis C */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hepatitis C <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={testResults.hepatitisC}
                        onChange={(e) => setTestResults({...testResults, hepatitisC: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="pending">Pending</option>
                        <option value="negative">Negative</option>
                        <option value="positive">Positive</option>
                      </select>
                    </div>

                    {/* Syphilis */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Syphilis <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={testResults.syphilis}
                        onChange={(e) => setTestResults({...testResults, syphilis: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="pending">Pending</option>
                        <option value="negative">Negative</option>
                        <option value="positive">Positive</option>
                      </select>
                    </div>

                    {/* Malaria */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Malaria <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={testResults.malaria}
                        onChange={(e) => setTestResults({...testResults, malaria: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="pending">Pending</option>
                        <option value="negative">Negative</option>
                        <option value="positive">Positive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Test Results Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Test Results Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(testResults).map(([test, result]) => (
                      <div key={test} className="flex items-center">
                        <span className="mr-2">{getTestResultIcon(result)}</span>
                        <span className={`text-sm font-medium capitalize ${getTestResultColor(result)}`}>
                          {test}: {result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clearance Status */}
                <div className={`border rounded-lg p-4 ${
                  Object.values(testResults).every(result => result === 'negative')
                    ? 'bg-green-50 border-green-200'
                    : Object.values(testResults).some(result => result === 'positive')
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <h4 className="font-semibold mb-2">
                    {Object.values(testResults).every(result => result === 'negative')
                      ? '✅ Eligible for Clearance'
                      : Object.values(testResults).some(result => result === 'positive')
                      ? '❌ Blood Rejected - Positive Test Results'
                      : '⏳ Awaiting Complete Test Results'
                    }
                  </h4>
                  <p className="text-sm">
                    {Object.values(testResults).every(result => result === 'negative')
                      ? 'All tests are negative. Blood can be cleared for use and added to inventory.'
                      : Object.values(testResults).some(result => result === 'positive')
                      ? 'One or more tests are positive. Blood must be discarded and donor notified.'
                      : 'Complete all mandatory tests to determine clearance status.'
                    }
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTestForm(false);
                      setSelectedDonation(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Record Test Results
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestingWorkflow;
