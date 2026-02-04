const path = require('path');
const backendBase = path.resolve(__dirname, '..', 'backend');
// Load backend environment variables (so MAPPLS_API_KEY from backend/.env is available)
require('dotenv').config({ path: path.join(backendBase, '.env') });
const connectDB = require(path.join(backendBase, 'config', 'database'));
const mapplsService = require(path.join(backendBase, 'services', 'mapplsService'));
const transportationService = require(path.join(backendBase, 'services', 'transportationService'));
const donorMobilizationService = require(path.join(backendBase, 'services', 'donorMobilizationService'));
const mongoose = require(path.join(backendBase, 'node_modules', 'mongoose'));

(async () => {
  try {
    console.log('\n=== Map Feature Automated Tests ===\n');

    // Connect to DB
    await connectDB();

    // 1) Radius-based search and expansion
    console.log('1) Radius-based search and expansion');
    const origin = { latitude: 12.9716, longitude: 77.5946 }; // Bengaluru center
    const radii = [5000, 10000, 25000];
    for (const r of radii) {
      console.log(`\n- Searching within ${r / 1000} km`);
      const res = await mapplsService.findNearby(origin.latitude, origin.longitude, 'blood bank', r);
      if (!res.success) {
        console.log('  -> Search failed or no results:', res.error || res);
        continue;
      }

      // Print top 5 results with distance and coords
      const top = res.results.slice(0, 5);
      if (top.length === 0) {
        console.log('  -> No nearby blood banks found in this radius');
      } else {
        top.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name} (${p.placeId}) — ${p.latitude},${p.longitude} — distance:${p.distance || 'n/a'}`);
        });
      }
    }

    // 2) Distance & ETA calculation (traffic-aware if Mappls key present)
    console.log('\n2) Distance & ETA calculation');
    // Use origin (hospital) and up to 5 destinations from last search
    const lastRes = await mapplsService.findNearby(origin.latitude, origin.longitude, 'blood bank', 25000);
    const destinations = (lastRes.success ? lastRes.results.slice(0, 5) : []).map(d => ({ latitude: d.latitude, longitude: d.longitude }));

    if (destinations.length === 0) {
      console.log('  -> No destinations available for ETA calculation (skipping)');
    } else {
      const dm = await mapplsService.getDistanceMatrix([origin], destinations);
      if (!dm.success) {
        console.log('  -> Distance matrix failed or fallback used:', dm.error || dm);
      } else {
        dm.matrix.forEach((row) => {
          console.log(`  Origin: ${row.origin}`);
          row.destinations.forEach((dest, idx) => {
            console.log(`    Dest ${idx + 1}: distance=${dest.distance}m, duration=${Math.round(dest.duration/60)}s`);
          });
        });
      }
    }

    // 3) Transport visual tracking (simulate creation if DB data available)
    console.log('\n3) Transport visual tracking (simulation)');
    try {
      // Attempt to find a sample request, blood bank, hospital from DB
      const BloodRequest = require('../backend/models/BloodRequest');
      const BloodBank = require('../backend/models/BloodBank');
      const Hospital = require('../backend/models/Hospital');

      const sampleRequest = await BloodRequest.findOne().lean();
      const sampleBank = await BloodBank.findOne().lean();
      const sampleHospital = await Hospital.findOne().lean();

      if (sampleRequest && sampleBank && sampleHospital) {
        console.log('  -> Found sample request, bank, hospital — creating transportation record');
        const inventoryItems = [];
        // Try to collect inventoryIds from Inventory collection if available
        const Inventory = require('../backend/models/Inventory');
        const inv = await Inventory.find({ bloodBankId: sampleBank._id }).limit(2);
        inv.forEach(i => inventoryItems.push({ inventoryId: i._id, units: 1 }));

        if (inventoryItems.length === 0) {
          console.log('  -> No inventory items found for sample bank — skipping creation');
        } else {
          const transport = await transportationService.createTransportation(sampleRequest._id, sampleBank._id, sampleHospital._id, inventoryItems);
          console.log('  -> Transportation created:', transport._id.toString());
          console.log('     pickup:', transport.pickupLocation.coordinates, 'delivery:', transport.deliveryLocation.coordinates);
          console.log('     estimatedDuration (min):', transport.estimatedDuration);
        }
      } else {
        console.log('  -> Missing sample data (BloodRequest/BloodBank/Hospital). Skipping transport creation test.');
      }
    } catch (err) {
      console.log('  -> Transport simulation failed:', err.message);
    }

    // 4) Donor proximity filtering
    console.log('\n4) Donor proximity filtering');
    try {
      const BloodRequest = require('../backend/models/BloodRequest');
      const sampleRequest = await BloodRequest.findOne().lean();
      if (!sampleRequest) {
        console.log('  -> No blood request found in DB. Skipping donor filtering test.');
      } else {
        const eligible = await donorMobilizationService.findEligibleDonors(sampleRequest, 20);
        console.log(`  -> Eligible donors found: ${eligible.length}`);
        eligible.slice(0, 5).forEach((d, i) => {
          console.log(`     ${i + 1}. Donor ${d._id} — distance: ${d.distance} km`);
        });
      }
    } catch (err) {
      console.log('  -> Donor filtering test failed:', err.message);
    }

    console.log('\n=== Map Feature Automated Tests Completed ===\n');

    // Close DB connection
    await mongoose.disconnect();
  } catch (error) {
    console.error('Test runner error:', error.message || error);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();
