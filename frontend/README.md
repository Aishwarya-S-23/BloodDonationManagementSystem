# Blood Connect Frontend

Production-ready React frontend for the Blood Donation Management System.

## Features

- **Role-Based Dashboards**: Separate interfaces for Hospital, Blood Bank, Donor, College, and Admin
- **Real-time Updates**: Socket.io integration for live notifications and status updates
- **Secure Authentication**: JWT-based authentication with role-based access control
- **Map Integration**: Leaflet maps for visualizing blood bank locations
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS
- **State Management**: Redux Toolkit for centralized state management

## Tech Stack

- **React** 18.2.0
- **React Router** 6.21.1
- **Redux Toolkit** 2.0.1
- **Tailwind CSS** 3.4.0
- **Axios** 1.6.2
- **Socket.io Client** 4.6.1
- **Leaflet** 1.9.4
- **React Hook Form** 7.49.2
- **React Toastify** 9.1.3

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running (see backend README)

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SOCKET_URL=http://localhost:3000
REACT_APP_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

5. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   │   ├── common/     # Common UI components
│   │   ├── forms/       # Form components
│   │   ├── layout/      # Layout components
│   │   └── maps/        # Map components
│   ├── pages/           # Page components
│   │   ├── auth/        # Authentication pages
│   │   ├── hospital/     # Hospital dashboard
│   │   ├── bloodbank/    # Blood bank dashboard
│   │   ├── donor/        # Donor dashboard
│   │   ├── college/      # College dashboard
│   │   └── admin/        # Admin dashboard
│   ├── services/         # API services
│   ├── store/            # Redux store
│   │   └── slices/       # Redux slices
│   ├── context/          # React Context
│   ├── routes/           # Route definitions
│   └── App.js            # Main app component
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Role-Based Features

### Hospital
- Create blood requests
- Track request fulfillment status
- View request timeline
- Cancel requests

### Blood Bank
- View and manage inventory
- Accept and fulfill requests
- Record test results
- Issue tested blood
- View expiring inventory alerts

### Donor
- View eligibility status
- Manage profile and availability
- View and confirm appointments
- Check donation history

### College
- View escalated requests
- Mobilize college donors
- Track participation

### Admin
- View system statistics
- Manage users
- View audit logs

## Authentication

The app uses JWT tokens stored in localStorage. Tokens are automatically attached to API requests via Axios interceptors.

## Real-time Updates

Socket.io is integrated for real-time notifications and status updates. The SocketContext provides connection management and event handling.

## Environment Variables

- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_SOCKET_URL` - Socket.io server URL
- `REACT_APP_MAP_TILE_URL` - Leaflet map tile URL

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Troubleshooting

### CORS Issues
Ensure the backend CORS_ORIGIN includes your frontend URL.

### Socket Connection Issues
Verify REACT_APP_SOCKET_URL matches your backend server URL.

### Map Not Loading
Check that Leaflet CSS is loaded and map tile URL is accessible.

## License

ISC

