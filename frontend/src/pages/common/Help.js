import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Help = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('emergency');

  const sections = [
    { id: 'emergency', label: 'Emergency Guide', icon: '🚨' },
    { id: 'donation', label: 'Donation Guide', icon: '🩸' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
    { id: 'contact', label: 'Contact', icon: '📞' },
  ];

  const handleEmergencyRequest = () => {
    if (user?.role === 'Hospital') {
      navigate('/requests/create');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Emergency Guide</h1>
        <p className="text-gray-600 mt-1">Get help and learn how to use BloodConnect</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b border-gray-200">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeSection === section.id
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeSection === 'emergency' && (
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
                <h2 className="text-2xl font-bold text-red-900 mb-4">
                  🚨 Emergency Blood Request Guide
                </h2>
                <p className="text-red-800 mb-4">
                  If you need blood urgently, follow these steps to create an emergency request:
                </p>
                <ol className="list-decimal list-inside space-y-3 text-red-800">
                  <li>
                    <strong>Create Emergency Request:</strong> Click the "Emergency Request" button
                    and fill in the required information including blood group, units needed, and
                    urgency level.
                  </li>
                  <li>
                    <strong>Automatic Donor Mobilization:</strong> Our system will automatically
                    notify eligible donors and nearby blood banks.
                  </li>
                  <li>
                    <strong>Track Status:</strong> Monitor your request status in real-time and
                    receive notifications as donors respond.
                  </li>
                  <li>
                    <strong>Coordination:</strong> Work with assigned blood banks to fulfill the
                    request quickly.
                  </li>
                </ol>
                <div className="mt-6">
                  <button
                    onClick={handleEmergencyRequest}
                    className="bg-red-600 text-white px-8 py-3 rounded-md font-bold hover:bg-red-700 transition-colors text-lg"
                  >
                    {user?.role === 'Hospital' ? 'Create Emergency Request' : 'Sign In to Create Request'}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded-r-lg">
                <h3 className="text-xl font-bold text-yellow-900 mb-3">Emergency Contact Numbers</h3>
                <ul className="space-y-2 text-yellow-800">
                  <li>
                    <strong>National Blood Helpline:</strong> 1911
                  </li>
                  <li>
                    <strong>Emergency Services:</strong> 102 (Ambulance), 108 (Emergency)
                  </li>
                  <li>
                    <strong>Local Blood Bank:</strong> Check the map for the nearest blood bank
                    contact information
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3">What to Include in Emergency Request</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Patient's blood group and component type needed</li>
                  <li>Number of units required</li>
                  <li>Urgency level (Critical, High, Medium)</li>
                  <li>Required date and time</li>
                  <li>Hospital location and contact information</li>
                  <li>Any special requirements or notes</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'donation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">🩸 Blood Donation Guide</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Before Donation</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Eat a healthy meal before donating</li>
                      <li>Drink plenty of fluids (water, juice)</li>
                      <li>Get a good night's sleep</li>
                      <li>Bring a valid ID</li>
                      <li>Avoid alcohol 24 hours before donation</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Eligibility Requirements</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Age: 18-65 years</li>
                      <li>Weight: Minimum 50 kg</li>
                      <li>Hemoglobin: Minimum 12.5 g/dL for women, 13 g/dL for men</li>
                      <li>No major illnesses or infections</li>
                      <li>At least 56 days since last donation</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">During Donation</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>The donation process takes about 10-15 minutes</li>
                      <li>A sterile needle is used once and then discarded</li>
                      <li>You'll donate approximately 450ml of blood</li>
                      <li>Medical staff will monitor you throughout</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">After Donation</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Rest for 15-20 minutes before leaving</li>
                      <li>Drink extra fluids for 24-48 hours</li>
                      <li>Avoid heavy lifting or strenuous exercise for 24 hours</li>
                      <li>Keep the bandage on for at least 4 hours</li>
                      <li>If you feel dizzy, lie down with your feet elevated</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'faq' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">❓ Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    How do I create a blood request?
                  </h3>
                  <p className="text-gray-700">
                    Hospitals can create blood requests through their dashboard. Navigate to "Create
                    Request" and fill in the required details including blood group, units needed,
                    and urgency level.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    How do I register as a donor?
                  </h3>
                  <p className="text-gray-700">
                    Sign up as a Donor during registration. Complete your profile with health
                    information and eligibility details. You'll receive notifications for matching
                    blood requests.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    How does the matching system work?
                  </h3>
                  <p className="text-gray-700">
                    Our system automatically matches blood requests with compatible donors based on
                    blood group compatibility, location proximity, and donor eligibility. Eligible
                    donors receive notifications for nearby requests.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    Can I see my donation history?
                  </h3>
                  <p className="text-gray-700">
                    Yes! Donors can view their complete donation history, appointments, and impact
                    in their profile section.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    What if I need to cancel a request?
                  </h3>
                  <p className="text-gray-700">
                    Hospitals can cancel pending or processing requests from the request details
                    page. Donors and blood banks will be notified of the cancellation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">📞 Contact & Support</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3">Support Email</h3>
                  <p className="text-gray-700 mb-2">support@bloodconnect.com</p>
                  <p className="text-sm text-gray-600">
                    Send us your questions or issues and we'll respond within 24 hours.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3">Emergency Helpline</h3>
                  <p className="text-gray-700 mb-2">1911</p>
                  <p className="text-sm text-gray-600">
                    National Blood Helpline - Available 24/7 for emergency assistance.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3">Technical Support</h3>
                  <p className="text-gray-700 mb-2">tech@bloodconnect.com</p>
                  <p className="text-sm text-gray-600">
                    For technical issues, app bugs, or feature requests.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3">Partnership Inquiries</h3>
                  <p className="text-gray-700 mb-2">partners@bloodconnect.com</p>
                  <p className="text-sm text-gray-600">
                    For hospitals, blood banks, or organizations interested in partnering.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                <h3 className="text-xl font-semibold mb-3">Need Immediate Help?</h3>
                <p className="text-gray-700 mb-4">
                  If you're experiencing a critical issue or emergency, please contact our 24/7
                  emergency helpline or use the Emergency Request feature in the app.
                </p>
                <button
                  onClick={handleEmergencyRequest}
                  className="bg-red-600 text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition-colors"
                >
                  Create Emergency Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Help;

