import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { inventoryService } from '../../services/inventoryService';
import { bloodBankService } from '../../services/bloodBankService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const InventoryManagement = () => {
  const { user } = useSelector(state => state.auth);
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState({
    bloodGroup: '',
    component: '',
    status: '',
  });

  const [newInventory, setNewInventory] = useState({
    bloodGroup: '',
    component: 'whole',
    units: '',
    expiryDate: '',
    batchNumber: '',
    source: 'donation',
  });

  useEffect(() => {
    loadInventory();
  }, [filter]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventory(filter);
      setInventory(response.inventory || []);
      setSummary(response.summary || {});
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    try {
      await bloodBankService.addInventory({
        ...newInventory,
        bloodBankId: user.profileId,
      });

      toast.success('Inventory added successfully');
      setShowAddForm(false);
      setNewInventory({
        bloodGroup: '',
        component: 'whole',
        units: '',
        expiryDate: '',
        batchNumber: '',
        source: 'donation',
      });
      loadInventory();
    } catch (error) {
      toast.error('Failed to add inventory');
    }
  };

  const handleExpiryCheck = async () => {
    try {
      const expiring = await inventoryService.getExpiringInventory(7);
      if (expiring.length > 0) {
        toast.warning(`${expiring.length} items expiring within 7 days`);
      } else {
        toast.success('No items expiring soon');
      }
    } catch (error) {
      toast.error('Failed to check expiring items');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      reserved: 'bg-yellow-100 text-yellow-800',
      issued: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800',
      discarded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getComponentIcon = (component) => {
    const icons = {
      whole: '🩸',
      platelets: '🩸',
      plasma: '🩸',
      red_cells: '🩸',
    };
    return icons[component] || '🩸';
  };

  const formatExpiryStatus = (expiryDate, status) => {
    if (status === 'expired' || status === 'discarded') return '';

    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Expired';
    if (days <= 7) return `Expires in ${days} day${days !== 1 ? 's' : ''}`;
    if (days <= 30) return `Expires in ${Math.ceil(days / 7)} weeks`;
    return 'Valid';
  };

  const filteredInventory = inventory.filter(item => {
    if (filter.bloodGroup && item.bloodGroup !== filter.bloodGroup) return false;
    if (filter.component && item.component !== filter.component) return false;
    if (filter.status && item.status !== filter.status) return false;
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
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage blood inventory, track expiry, and monitor stock levels</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExpiryCheck}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Check Expiry
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            ➕ Add Inventory
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(summary).map(([key, data]) => (
          <div key={key} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalUnits || 0}</p>
              </div>
              <div className="text-3xl">{getComponentIcon(key.split('_')[1])}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filter.bloodGroup}
            onChange={(e) => setFilter({...filter, bloodGroup: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            value={filter.component}
            onChange={(e) => setFilter({...filter, component: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Components</option>
            <option value="whole">Whole Blood</option>
            <option value="platelets">Platelets</option>
            <option value="plasma">Plasma</option>
            <option value="red_cells">Red Cells</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({...filter, status: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="issued">Issued</option>
            <option value="expired">Expired</option>
          </select>

          <button
            onClick={() => setFilter({bloodGroup: '', component: '', status: ''})}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Inventory Items ({filteredInventory.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blood Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-red-600">{item.bloodGroup}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{getComponentIcon(item.component)}</span>
                      <span className="capitalize">{item.component.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {item.units}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="font-medium">
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </div>
                      <div className={`text-xs ${
                        formatExpiryStatus(item.expiryDate, item.status).includes('Expires')
                          ? 'text-yellow-600'
                          : formatExpiryStatus(item.expiryDate, item.status) === 'Expired'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {formatExpiryStatus(item.expiryDate, item.status)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {item.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    {item.status === 'available' && (
                      <button className="text-green-600 hover:text-green-900">
                        Reserve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">📦</span>
            <h3 className="text-lg font-medium text-gray-900 mt-4">No inventory items found</h3>
            <p className="text-gray-600 mt-2">Add inventory items or adjust your filters</p>
          </div>
        )}
      </div>

      {/* Add Inventory Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add Inventory</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddInventory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group *
                  </label>
                  <select
                    value={newInventory.bloodGroup}
                    onChange={(e) => setNewInventory({...newInventory, bloodGroup: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select blood group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component *
                  </label>
                  <select
                    value={newInventory.component}
                    onChange={(e) => setNewInventory({...newInventory, component: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="whole">Whole Blood</option>
                    <option value="platelets">Platelets</option>
                    <option value="plasma">Plasma</option>
                    <option value="red_cells">Red Cells</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="new-inventory-units" className="block text-sm font-medium text-gray-700 mb-2">
                    Units *
                  </label>
                  <input
                    id="new-inventory-units"
                    type="number"
                    value={newInventory.units}
                    onChange={(e) => setNewInventory({...newInventory, units: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="new-inventory-expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    id="new-inventory-expiryDate"
                    type="date"
                    value={newInventory.expiryDate}
                    onChange={(e) => setNewInventory({...newInventory, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="new-inventory-batchNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number
                  </label>
                  <input
                    id="new-inventory-batchNumber"
                    type="text"
                    value={newInventory.batchNumber}
                    onChange={(e) => setNewInventory({...newInventory, batchNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Optional batch identifier"
                  />
                </div>

                <div>
                  <label htmlFor="new-inventory-source" className="block text-sm font-medium text-gray-700 mb-2">
                    Source *
                  </label>
                  <select
                    id="new-inventory-source"
                    value={newInventory.source}
                    onChange={(e) => setNewInventory({...newInventory, source: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="donation">Donation</option>
                    <option value="transfer">Transfer</option>
                    <option value="purchase">Purchase</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Add Inventory
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Inventory Details</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blood Group:</span>
                      <span className="font-medium text-red-600">{selectedItem.bloodGroup}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Component:</span>
                      <span className="font-medium capitalize">{selectedItem.component.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Units:</span>
                      <span className="font-medium">{selectedItem.units}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedItem.status)}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expiry Date:</span>
                      <span className="font-medium">{new Date(selectedItem.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Source:</span>
                      <span className="font-medium capitalize">{selectedItem.source}</span>
                    </div>
                    {selectedItem.batchNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Batch Number:</span>
                        <span className="font-medium">{selectedItem.batchNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testing Results */}
              {selectedItem.testResults && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Testing Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(selectedItem.testResults).map(([test, result]) => {
                      if (test === 'testedAt') return null;
                      return (
                        <div key={test} className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600 capitalize">
                            {test.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className={`font-medium ${
                            result === 'negative' ? 'text-green-600' :
                            result === 'positive' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {result}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedItem.testResults.testedAt && (
                    <p className="text-sm text-gray-500 mt-2">
                      Tested on: {new Date(selectedItem.testResults.testedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Reservation Info */}
              {selectedItem.reservedFor && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Reservation Details</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">Reserved For:</span>
                        <span className="font-medium ml-2">Request #{selectedItem.reservedFor.requestId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reserved At:</span>
                        <span className="font-medium ml-2">
                          {new Date(selectedItem.reservedFor.reservedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;