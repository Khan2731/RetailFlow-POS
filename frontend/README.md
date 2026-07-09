# PizzaHub POS System Frontend

A modern, responsive frontend for the PizzaHub Point of Sale (POS) system built with React, Material UI, and Vite.

## Features

- **Authentication**: JWT-based login with token management
- **Dashboard**: Real-time statistics and overview
- **Products**: Full product management with search and filtering
- **Orders**: Order creation, management, and status tracking
- **Billing**: Invoice generation with print functionality
- **Order History**: Complete order history with search
- **Inventory**: Inventory tracking with low stock alerts
- **Staff**: Staff management with role-based access
- **Delivery**: Delivery management with driver assignment

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Material UI** - UI component library
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **React to Print** - Invoice printing

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   └── Navbar.jsx        # Top navigation bar
│   ├── context/
│   │   └── AuthContext.jsx   # Authentication context
│   ├── pages/
│   │   ├── Login.jsx         # Login page
│   │   ├── Dashboard.jsx     # Dashboard with stats
│   │   ├── Products.jsx      # Product management
│   │   ├── Orders.jsx        # Order management
│   │   ├── Billing.jsx       # Billing and invoices
│   │   ├── OrderHistory.jsx  # Order history
│   │   ├── Inventory.jsx     # Inventory management
│   │   ├── Staff.jsx         # Staff management
│   │   └── Delivery.jsx      # Delivery management
│   ├── services/
│   │   └── api.js            # API service layer
│   ├── utils/
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on http://localhost:3000

## Installation

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory (optional)
   - Default API URL is `http://localhost:3000/api`
   - To customize, create `.env` file:
     ```
     VITE_API_URL=http://localhost:3000/api
     ```

## Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Development

1. **Start the backend server** (in a separate terminal)
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser**
   - Navigate to http://localhost:5173
   - Login with demo credentials:
     - Username: `john`
     - Password: `password123`

## Features Overview

### Authentication
- JWT token-based authentication
- Token storage in localStorage
- Automatic token refresh
- Protected routes
- Logout functionality

### Dashboard
- Total orders count
- Total products count
- Total revenue
- Pending deliveries count
- Real-time statistics

### Products
- View all products
- Search products by name
- Filter by category
- Add new products (admin only)
- Edit existing products (admin only)
- Delete products (admin only)

### Orders
- Create new orders
- View order details
- Add items to orders
- Update order status
- View order items
- Remove items from orders

### Billing
- Create bills from completed orders
- Automatic tax calculation (8%)
- Discount support
- Multiple payment methods
- Print invoices
- View billing history

### Order History
- View all orders
- Search by order ID, table, or waiter
- Filter by status
- View order timestamps
- Status color coding

### Inventory
- View all inventory items
- Search items
- Low stock alerts (≤10 units)
- Add new items (admin only)
- Edit items (admin only)
- Quick quantity adjustment (+/-)
- Delete items (admin only)

### Staff (Admin Only)
- View all staff members
- Search staff
- Filter by role
- Add new staff
- Edit staff details
- Update passwords
- Delete staff
- Role-based access control

### Delivery
- Create new deliveries
- Assign drivers
- Update delivery status
- Track delivery progress
- View delivery details
- Filter by status
- Search deliveries

## Role-Based Access Control

- **Manager (Admin)**: Full access to all features including staff management
- **Waiter**: Orders, billing, order history
- **Chef**: Orders, order history
- **Cashier**: Billing, order history
- **Driver**: Delivery management

## API Integration

The frontend connects to the backend API using Axios with automatic token injection:

```javascript
// API endpoints
/api/auth/login
/api/products
/api/orders
/api/billing
/api/inventory
/api/staff
/api/delivery
```

## Responsive Design

- Mobile-friendly sidebar navigation
- Responsive tables
- Touch-friendly buttons
- Adaptive layouts
- Material UI responsive breakpoints

## Error Handling

- Global error handling
- Toast notifications for user feedback
- API error handling
- Form validation
- Loading indicators

## Print Functionality

- Invoice printing using react-to-print
- Clean invoice layout
- Includes order details, items, and totals
- Browser print dialog integration

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Preview the build**
   ```bash
   npm run preview
   ```

3. **Deploy**
   - Upload the `dist` folder to your web server
   - Configure your server to handle client-side routing
   - Ensure API CORS is configured for your production domain

## Environment Variables

Optional environment variables:

```env
VITE_API_URL=http://localhost:3000/api
```

## Troubleshooting

### API Connection Issues
- Ensure backend server is running on port 3000
- Check CORS configuration in backend
- Verify API URL in environment variables

### Login Issues
- Verify backend is running
- Check database has been seeded
- Ensure correct credentials
- Check browser console for errors

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check Node.js version (requires v16+)

## Development Tips

- Use React DevTools for debugging
- Check Network tab in browser DevTools for API calls
- Use Material UI documentation for component props
- Test responsive design using browser DevTools device mode

## Security Notes

- Tokens stored in localStorage (consider httpOnly cookies for production)
- API calls include JWT token in Authorization header
- Protected routes check authentication status
- Admin-only endpoints protected on both frontend and backend

## License

ISC
