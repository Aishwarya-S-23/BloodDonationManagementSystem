# Blood Connect - Blood Donation Management System Backend

A production-ready, healthcare-compliant REST API backend for managing blood donation requests, inventory, and donor coordination.

## Features

- **Role-Based Access Control (RBAC)**: Admin, Hospital, BloodBank, Donor, College
- **Intelligent Decision Engine**: Automatically selects fastest fulfillment option
- **Real-time Updates**: Socket.io for live notifications
- **Geolocation**: Haversine formula for distance calculations
- **Compliance**: All blood flow through licensed blood banks only
- **Wastage Prevention**: Auto-stop notifications, inventory locking, expiry tracking
- **Audit Logging**: Full traceability of all actions
- **Testing & Safety**: Mandatory testing before blood issuance

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** Authentication
- **Socket.io** for real-time updates
- **Twilio** for SMS/Email notifications
- **Express Validator** for input validation
- **Helmet** for security headers
- **Rate Limiting** for API protection

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Twilio account (for SMS/Email - optional)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd BloodConnect
```

2. Install dependencies:
```bash
cd backend
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

5. Start MongoDB (if running locally):
```bash
mongod
```

6. Start the server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

### Authentication

All protected routes require JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

#### Hospital Routes (Hospital role required)
- `POST /api/hospitals/requests` - Create blood request
- `GET /api/hospitals/requests` - List hospital's requests
- `GET /api/hospitals/requests/:id` - Get request details
- `PUT /api/hospitals/requests/:id/cancel` - Cancel request

#### Blood Bank Routes (BloodBank role required)
- `GET /api/blood-banks/inventory` - View inventory
- `POST /api/blood-banks/inventory/fulfill` - Fulfill request
- `GET /api/blood-banks/inventory/expiring` - Get expiring inventory
- `GET /api/blood-banks/requests` - View assigned requests
- `GET /api/blood-banks/donations` - View donations
- `POST /api/blood-banks/donations/:id/test` - Record test results
- `POST /api/blood-banks/donations/:id/issue` - Issue tested blood

#### Donor Routes (Donor role required)
- `GET /api/donors/profile` - View profile
- `PUT /api/donors/profile` - Update profile
- `GET /api/donors/appointments` - View appointments
- `POST /api/donors/appointments/:id/confirm` - Confirm appointment
- `GET /api/donors/eligibility` - Check eligibility

#### College Routes (College role required)
- `GET /api/colleges/requests` - View escalated requests
- `POST /api/colleges/donors/mobilize` - Mobilize college donors

#### Admin Routes (Admin role required)
- `GET /api/admin/users` - List all users
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/statistics` - System statistics

#### Notifications (All authenticated users)
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Workflow

### Blood Request Flow

1. **Hospital creates request** → `POST /api/hospitals/requests`
2. **Decision Engine processes**:
   - Checks in-house blood bank (if exists)
   - Finds nearby external blood banks
   - Evaluates donor mobilization
   - Chooses fastest option
3. **Inventory Resolution**:
   - Reserves inventory units
   - Locks during fulfillment
4. **Donor Mobilization** (if needed):
   - Filters by compatibility, distance, cooldown
   - Sends notifications
   - Creates appointments
5. **College Escalation** (for rare groups/emergencies):
   - Notifies college coordinators
   - Mobilizes college donors
6. **Testing & Issuance**:
   - Blood bank records test results
   - Only safe units issued
   - Inventory updated
   - Request auto-closed when fulfilled

## Real-time Updates (Socket.io)

Connect to Socket.io server:
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Subscribe to notifications
socket.emit('subscribe_notifications');

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Subscribe to request updates
socket.emit('subscribe_request', requestId);
socket.on('request_updated', (data) => {
  console.log('Request updated:', data);
});
```

## Security Features

- JWT authentication on all protected routes
- Role-based access control (RBAC)
- Password hashing with bcryptjs
- Input validation and sanitization
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS configuration
- Audit logging for traceability

## Compliance

- All blood flow through licensed blood banks only
- Hospital-to-hospital transfers only if both have licensed blood banks
- Mandatory testing before issuance
- Full audit trail
- Expiry tracking and wastage prevention

## Wastage Prevention

- Auto-stop donor notifications when request fulfilled
- Inventory locking during issuance
- Expiry tracking and alerts
- Cooldown enforcement for donors
- Reject excess donations

## Database Models

- **User**: Authentication and role management
- **Hospital**: Hospital profiles with license and location
- **BloodBank**: Blood bank profiles with testing capability
- **Donor**: Donor profiles with eligibility and cooldown
- **College**: College profiles for escalation
- **BloodRequest**: Blood requests with fulfillment tracking
- **Inventory**: Blood inventory with expiry tracking
- **Donation**: Donation records with test results
- **Appointment**: Donation scheduling
- **Notification**: In-app notifications
- **AuditLog**: Complete audit trail

## Error Handling

All errors are handled centrally and return consistent JSON responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Development

### Project Structure
```
backend/
├── config/          # Configuration files
├── models/          # Mongoose schemas
├── routes/          # Express routes
├── controllers/     # Request handlers
├── services/        # Business logic
├── middleware/      # Auth, validation, error handling
├── utils/           # Helpers and utilities
├── socket/          # Socket.io setup
└── server.js        # Entry point
```

### Running in Development
```bash
npm run dev
```

### Environment Variables
See `.env.example` for all required environment variables.

## Testing

To test the API, use tools like Postman or curl:

```bash
# Register a hospital
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hospital@example.com",
    "password": "password123",
    "role": "Hospital",
    "profileData": {
      "name": "City Hospital",
      "licenseNumber": "HOSP-001",
      "address": {
        "street": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "zipCode": "400001"
      },
      "coordinates": {
        "latitude": 19.0760,
        "longitude": 72.8777
      },
      "contact": {
        "phone": "+911234567890",
        "email": "hospital@example.com"
      }
    }
  }'
```

## License

ISC

## Support

For issues and questions, please contact the development team.

