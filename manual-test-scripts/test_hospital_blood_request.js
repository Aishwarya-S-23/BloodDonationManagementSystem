/**
 * Manual Test Script: Hospital Blood Request Fulfillment
 *
 * Scenario:
 * - Hospital A has no inventory.
 * - Blood Bank B has 2 units of blood.
 * - A critical request for 4 units is made.
 *
 * Expected Outcome:
 * 1. Blood Bank B supplies 2 units immediately.
 * 2. The remaining 2 units trigger donor mobilization.
 * 3. If Blood Bank C fulfills the remaining 2 units later, donor appointments are auto-cancelled.
 */

const axios = require('axios');

(async () => {
  try {
    console.log('Starting Manual Test: Hospital Blood Request Fulfillment');

    // Step 1: Ensure Hospital A has no inventory
    console.log('Step 1: Setting Hospital A inventory to 0');
    await axios.post('http://localhost:5000/api/hospitals/update-inventory', {
      hospitalId: 'A',
      inventory: 0,
    });

    // Step 2: Ensure Blood Bank B has 2 units of blood
    console.log('Step 2: Setting Blood Bank B inventory to 2 units');
    await axios.post('http://localhost:5000/api/bloodbanks/update-inventory', {
      bloodBankId: 'B',
      inventory: 2,
    });

    // Step 3: Make a critical request for 4 units
    console.log('Step 3: Hospital A requests 4 units of blood (critical)');
    const requestResponse = await axios.post('http://localhost:5000/api/requests', {
      hospitalId: 'A',
      unitsRequested: 4,
      priority: 'critical',
    });
    console.log('Request Response:', requestResponse.data);

    // Step 4: Verify Blood Bank B supplies 2 units
    console.log('Step 4: Verifying Blood Bank B supplies 2 units');
    const supplyResponse = await axios.get('http://localhost:5000/api/requests/status', {
      params: { requestId: requestResponse.data.requestId },
    });
    console.log('Supply Status:', supplyResponse.data);

    // Step 5: Verify donor mobilization for remaining 2 units
    console.log('Step 5: Verifying donor mobilization for remaining 2 units');
    const donorMobilizationStatus = await axios.get('http://localhost:5000/api/donors/mobilization-status', {
      params: { requestId: requestResponse.data.requestId },
    });
    console.log('Donor Mobilization Status:', donorMobilizationStatus.data);

    // Step 6: Simulate Blood Bank C fulfilling the remaining 2 units
    console.log('Step 6: Simulating Blood Bank C fulfilling the remaining 2 units');
    await axios.post('http://localhost:5000/api/bloodbanks/fulfill-request', {
      bloodBankId: 'C',
      requestId: requestResponse.data.requestId,
      unitsSupplied: 2,
    });

    // Step 7: Verify donor appointments are auto-cancelled
    console.log('Step 7: Verifying donor appointments are auto-cancelled');
    const donorCancellationStatus = await axios.get('http://localhost:5000/api/donors/cancellation-status', {
      params: { requestId: requestResponse.data.requestId },
    });
    console.log('Donor Cancellation Status:', donorCancellationStatus.data);

    console.log('Manual Test Completed Successfully');
  } catch (error) {
    console.error('Error during manual test:', error.response?.data || error.message);
  }
})();