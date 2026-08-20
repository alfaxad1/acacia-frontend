# Acacia SACCO Management System

A modern React-based frontend application for managing SACCO (Savings and Credit Cooperative Organization) operations.

## Features

### Dashboard
- Real-time SACCO balance overview
- Active loans tracking
- Total loans issued statistics
- Members with arrears monitoring
- Weekly compliance rate visualization
- Quick stats with key performance indicators

### Member Management
- View all members with detailed information
- Add new members
- Edit member details
- Delete members
- Track member status (Active, Inactive, Suspended)
- View member number, contact information, and join dates

### Loan Management
- Request new loans
- View all loans with detailed information
- Approve or reject pending loans
- Disburse approved loans
- Record loan repayments
- Track loan status (Pending, Approved, Disbursed, Repaid, Rejected, Defaulted)
- View loan amounts, interest rates, and due dates

### Contributions Management
- Record member contributions
- Track contributions by period
- View payment status (On Time, Late)
- Monitor auto-generated contributions
- View total contributions and statistics
- Track late payments

## Tech Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling
- Custom hooks for API data fetching

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Backend API running (Acacia Backend)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your backend API URL:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## API Integration

The frontend connects to the Acacia Backend API. Ensure the following endpoints are available:

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard statistics

### Members
- `GET /api/members` - Get all members
- `GET /api/members/active` - Get active members
- `GET /api/members/:id` - Get member by ID
- `POST /api/members` - Create new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member
- `PATCH /api/members/:id/status` - Update member status

### Loans
- `GET /api/loans` - Get all loans
- `GET /api/loans/:id` - Get loan by ID
- `GET /api/loans/member/:memberId` - Get loans by member
- `GET /api/loans/status/PENDING` - Get pending loans
- `GET /api/loans/status/DISBURSED` - Get active loans
- `POST /api/loans/request` - Request new loan
- `POST /api/loans/:id/approve` - Approve loan
- `POST /api/loans/:id/reject` - Reject loan
- `POST /api/loans/:id/disburse` - Disburse loan
- `POST /api/loans/:id/repay` - Record repayment

### Contributions
- `GET /api/contributions` - Get all contributions
- `GET /api/contributions/period/:periodId` - Get contributions by period
- `GET /api/contributions/member/:memberId` - Get contributions by member
- `POST /api/contributions` - Record contribution

### Periods
- `GET /api/periods` - Get all contribution periods
- `GET /api/periods/current` - Get current period
- `POST /api/periods` - Create new period

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ErrorMessage.tsx
│   ├── Layout.tsx
│   ├── LoadingSpinner.tsx
│   ├── Modal.tsx
│   ├── StatCard.tsx
│   └── Table.tsx
├── hooks/             # Custom React hooks
│   └── useApi.ts
├── pages/             # Main page components
│   ├── Contributions.tsx
│   ├── Dashboard.tsx
│   ├── Loans.tsx
│   └── Members.tsx
├── services/          # API integration
│   └── api.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Utility functions
│   └── format.ts
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## Key Features

### Responsive Design
- Mobile-friendly interface
- Collapsible sidebar navigation
- Adaptive layouts for all screen sizes

### Real-time Data
- Automatic data fetching and caching
- Refresh functionality on all pages
- Error handling with retry options

### User-Friendly Interface
- Clean and modern design
- Intuitive navigation
- Clear status indicators
- Modal-based forms for better UX

### Type Safety
- Full TypeScript implementation
- Strict type checking
- IntelliSense support

## Future Enhancements

Consider adding:
- Reports generation (PDF/Excel)
- Advanced filtering and search
- Data visualization with charts
- Member portal for self-service
- SMS/Email notifications
- Audit trail and activity logs
- Role-based access control
- Batch operations for contributions
