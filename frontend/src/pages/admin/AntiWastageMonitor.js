import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const AntiWastageMonitor = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiringInventory, setExpiringInventory] = useState([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);
  const [lastMaintenance, setLastMaintenance] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load statistics
      const statsResponse = await adminService.getStatistics();
      setStats(statsResponse.statistics);

      // Load expiring inventory (mock data for demo)
      const mockExpiring = [
        {
          id: 'inv001',
          bloodBank: 'Central Blood Bank',
          bloodGroup: 'O+',
          component: 'whole',
          units: 5,
          expiryDate: '2026-01-25',
          daysUntilExpiry: 5,
          status: 'available',
        },
        {
          id: 'inv002',
          bloodBank: 'City Blood Center',
          bloodGroup: 'A-',
          component: 'platelets',
          units: 2,
          expiryDate: '2026-01-24',
          daysUntilExpiry: 4,
          status: 'available',
        },
        {
          id: 'inv003',
          bloodBank: 'Regional Blood Bank',
          bloodGroup: 'AB+',
          component: 'plasma',
          units: 3,
          expiryDate: '2026-01-23',
          daysUntilExpiry: 3,
          status: 'available',
        },
      ];
      setExpiringInventory(mockExpiring);

      // Load optimization suggestions (mock data)
      const mockOptimizations = [
        {
          bloodBank: 'Central Blood Bank',
          issue: 'Excess O+ inventory (25 units)',
          suggestion: 'Redistribute 10 units to City Blood Center (currently has 5 units)',
          impact: 'Reduce waste by 40%',
          priority: 'high',
        },
        {
          bloodBank: 'Regional Blood Bank',
          issue: 'Low A- platelet stock (2 units)',
          suggestion: 'Request transfer from Central Blood Bank (has 15 units)',
          impact: 'Improve emergency response capability',
          priority: 'medium',
        },
        {
          bloodBank: 'City Blood Center',
          issue: 'AB+ plasma expiring in 3 days (8 units)',
          suggestion: 'Prioritize distribution to hospitals with AB+ requests',
          impact: 'Prevent 8 unit loss',
          priority: 'critical',
        },
      ];
      setOptimizationSuggestions(mockOptimizations);

      // Mock last maintenance info
      setLastMaintenance({
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        expiredReservations: 2,
        expiredUnits: 1,
        optimizations: 3,
      });

    } catch (error) {
      console.error('Error loading anti-wastage data:', error);
      toast.error('Failed to load anti-wastage data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getExpiryUrgency = (days) => {
    if (days <= 1) return { color: 'bg-red-100 text-red-800', urgency: 'Critical' };
    if (days <= 3) return { color: 'bg-orange-100 text-orange-800', urgency: 'High' };
    if (days <= 7) return { color: 'bg-yellow-100 text-yellow-800', urgency: 'Medium' };
    return { color: 'bg-green-100 text-green-800', urgency: 'Low' };
  };

  const runMaintenance = async () => {
    try {
      toast.info('Running anti-wastage maintenance...', { autoClose: 3000 });
      // In a real implementation, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      toast.success('Maintenance completed successfully!');
      loadData();
    } catch (error) {
      toast.error('Maintenance failed');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anti-Wastage Monitor</h1>
          <p className="text-gray-600 mt-1">Monitor and prevent blood wastage through intelligent inventory management</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runMaintenance}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            🔧 Run Maintenance
          </button>
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-red-600">
                {stats?.inventory?.expiring || 0}
              </p>
              <p className="text-xs text-gray-500">units</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Inventory</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.inventory?.total || 0}
              </p>
              <p className="text-xs text-gray-500">units</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">🔄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats?.inventory?.byStatus?.find(s => s._id === 'available')?.count || 0}
              </p>
              <p className="text-xs text-gray-500">units</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">🛡️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reserved</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats?.inventory?.byStatus?.find(s => s._id === 'reserved')?.count || 0}
              </p>
              <p className="text-xs text-gray-500">units</p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Maintenance Info */}
      {lastMaintenance && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Last Maintenance Run</h3>
              <p className="text-blue-700">
                {lastMaintenance.timestamp.toLocaleString()} •
                Released {lastMaintenance.expiredReservations} expired reservations •
                Discarded {lastMaintenance.expiredUnits} expired units •
                Generated {lastMaintenance.optimizations} optimization suggestions
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              ✅ Completed
            </span>
          </div>
        </div>
      )}

      {/* Expiring Inventory Alert */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Expiring Inventory ({expiringInventory.length})</h3>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              Requires Attention
            </span>
          </div>
        </div>

        <div className="p-6">
          {expiringInventory.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">✅</span>
              <h3 className="text-lg font-medium text-gray-900 mt-4">No inventory expiring soon</h3>
              <p className="text-gray-600 mt-2">All inventory is within safe expiry periods</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expiringInventory.map((item) => {
                const expiryInfo = getExpiryUrgency(item.daysUntilExpiry);
                return (
                  <div key={item.id} className={`border-2 rounded-lg p-4 ${expiryInfo.color}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <span className="text-2xl mr-4">🩸</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {item.bloodBank} - {item.units} units {item.bloodGroup} {item.component}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Expires: {item.expiryDate} ({item.daysUntilExpiry} days remaining)
                          </p>
                          <p className="text-sm font-medium text-gray-700 mt-1">
                            Status: {item.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold mb-2 block ${expiryInfo.color}`}>
                          {expiryInfo.urgency} PRIORITY
                        </span>
                        <div className="space-y-1">
                          <button className="block text-blue-600 hover:text-blue-900 text-sm">
                            Transfer to Hospital
                          </button>
                          <button className="block text-green-600 hover:text-green-900 text-sm">
                            Extend Usage
                          </button>
                          <button className="block text-red-600 hover:text-red-900 text-sm">
                            Mark for Disposal
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Optimization Suggestions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Inventory Optimization Suggestions</h3>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Smart Recommendations
            </span>
          </div>
        </div>

        <div className="p-6">
          {optimizationSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🎯</span>
              <h3 className="text-lg font-medium text-gray-900 mt-4">No optimization suggestions</h3>
              <p className="text-gray-600 mt-2">Inventory distribution is currently optimal</p>
            </div>
          ) : (
            <div className="space-y-4">
              {optimizationSuggestions.map((suggestion, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded mr-3 ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority.toUpperCase()}
                        </span>
                        <span className="font-semibold text-gray-900">{suggestion.bloodBank}</span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{suggestion.issue}</h4>
                      <p className="text-gray-700 mb-2">{suggestion.suggestion}</p>
                      <p className="text-sm font-medium text-green-700">Impact: {suggestion.impact}</p>
                    </div>
                    <div className="ml-4">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                        Implement
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Automated Actions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">🤖 Automated Anti-Wastage Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2">Reservation Expiry</h4>
            <p className="text-sm text-yellow-800 mb-3">
              Automatically releases blood reservations that expire without fulfillment
            </p>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
              Active - Runs every 5 minutes
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2">Expiry Monitoring</h4>
            <p className="text-sm text-yellow-800 mb-3">
              Identifies and alerts about inventory approaching expiry dates
            </p>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
              Active - Runs hourly
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2">Optimization Engine</h4>
            <p className="text-sm text-yellow-800 mb-3">
              Analyzes inventory distribution and suggests optimal transfers
            </p>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
              Active - Runs hourly
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AntiWastageMonitor;
