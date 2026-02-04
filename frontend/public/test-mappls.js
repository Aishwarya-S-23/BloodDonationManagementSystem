// Simple test for Mappls integration
// Run this in the browser console on the test-map page

window.testMappls = async function() {
  console.log('🧪 Testing Mappls Integration...');

  try {
    // Check if Mappls SDK is loaded
    if (!window.mappls) {
      console.error('❌ Mappls SDK not loaded');
      return;
    }

    console.log('✅ Mappls SDK loaded');
    console.log('Available APIs:', Object.keys(window.mappls));

    // Check if Map constructor exists
    if (!window.mappls.Map) {
      console.error('❌ Mappls Map constructor not available');
      return;
    }

    console.log('✅ Mappls Map constructor available');

    // Try to create a test map
    const testContainer = document.createElement('div');
    testContainer.id = 'test-mappls-container';
    testContainer.style.width = '400px';
    testContainer.style.height = '300px';
    testContainer.style.border = '1px solid red';
    testContainer.style.position = 'fixed';
    testContainer.style.top = '10px';
    testContainer.style.right = '10px';
    testContainer.style.zIndex = '9999';
    document.body.appendChild(testContainer);

    console.log('Creating test map...');
    const testMap = new window.mappls.Map(testContainer, {
      center: [28.6139, 77.2090],
      zoom: 10
    });

    console.log('✅ Test map created successfully!');
    console.log('Test map object:', testMap);

    // Add a test marker
    setTimeout(() => {
      try {
        console.log('Adding test marker...');
        const marker = new window.mappls.Marker({
          position: [28.6139, 77.2090],
          map: testMap
        });
        console.log('✅ Test marker added successfully!');
      } catch (markerError) {
        console.error('❌ Failed to add marker:', markerError);
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Mappls test failed:', error);
  }
};

// Auto-run the test after 3 seconds
setTimeout(() => {
  if (window.location.pathname === '/test-map') {
    console.log('🔄 Auto-running Mappls test on test-map page...');
    window.testMappls();
  }
}, 3000);
