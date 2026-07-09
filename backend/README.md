# PizzaHub POS System Backend

A complete backend for a PizzaHub Point of Sale (POS) system built with Node.js, Express.js, SQLite, and MVC architecture.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Products**: Full CRUD operations for menu items
- **Orders**: Order management with status tracking
- **Order Items**: Detailed order item management
- **Billing**: Complete billing system with tax, discount, and payment method support
- **Staff**: Staff management with role-based access control
- **Inventory**: Inventory tracking with low stock alerts
- **Delivery**: Delivery management with driver assignment

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite (sqlite3)** - Database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **express-validator** - Input validation
- **dotenv** - Environment variable management

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── productController.js # Product CRUD operations
│   ├── orderController.js   # Order management
│   ├── orderItemController.js # Order item management
│   ├── billingController.js # Billing operations
│   ├── staffController.js   # Staff management
│   ├── inventoryController.js # Inventory management
│   └── deliveryController.js # Delivery management
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── products.js          # Product routes
│   ├── orders.js            # Order routes
│   ├── orderItems.js        # Order item routes
│   ├── billing.js           # Billing routes
│   ├── staff.js             # Staff routes
│   ├── inventory.js         # Inventory routes
│   └── delivery.js          # Delivery routes
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── errorHandler.js      # Global error handling
│   └── validation.js        # Input validation middleware
├── database/
│   ├── init.js              # Database initialization script
│   └── seed.js              # Database seeding script
├── server.js                # Main application entry point
├── package.json             # Dependencies and scripts
├── schema.sql               # Database schema
├── seed.sql                 # Seed data
├── .env                     # Environment variables
└── README.md                # This file
```

## Installation

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - The `.env` file is already created with default values
   - Update the `JWT_SECRET` in production for security

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Seed the database with sample data**
   ```bash
   npm run seed-db
   ```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run init-db` - Initialize the database schema
- `npm run seed-db` - Seed the database with sample data

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new staff member
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get current user profile (requires auth)

### Products

- `GET /api/products` - Get all products
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/:id` - Get a specific product
- `POST /api/products` - Create a new product (admin only)
- `PUT /api/products/:id` - Update a product (admin only)
- `DELETE /api/products/:id` - Delete a product (admin only)

### Orders

- `GET /api/orders` - Get all orders
- `GET /api/orders/table/:table_no` - Get orders by table number
- `GET /api/orders/status/:status` - Get orders by status
- `GET /api/orders/:id` - Get a specific order
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id` - Update an order
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete an order

### Order Items

- `GET /api/order-items/order/:order_id` - Get order items by order ID
- `GET /api/order-items/:id` - Get a specific order item
- `POST /api/order-items` - Create a new order item
- `PUT /api/order-items/:id` - Update an order item
- `DELETE /api/order-items/:id` - Delete an order item

### Billing

- `GET /api/billing` - Get all billing records
- `GET /api/billing/order/:order_id` - Get billing by order ID
- `GET /api/billing/:id` - Get a specific billing record
- `POST /api/billing` - Create a new billing record
- `PUT /api/billing/:id` - Update a billing record
- `DELETE /api/billing/:id` - Delete a billing record

### Staff

- `GET /api/staff` - Get all staff members
- `GET /api/staff/role/:role` - Get staff by role
- `GET /api/staff/shift/:shift` - Get staff by shift
- `GET /api/staff/:id` - Get a specific staff member
- `POST /api/staff` - Create a new staff member (admin only)
- `PUT /api/staff/:id` - Update a staff member (admin only)
- `PATCH /api/staff/:id/password` - Update staff password (admin only)
- `DELETE /api/staff/:id` - Delete a staff member (admin only)

### Inventory

- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/:id` - Get a specific inventory item
- `POST /api/inventory` - Create a new inventory item (admin only)
- `PUT /api/inventory/:id` - Update an inventory item (admin only)
- `PATCH /api/inventory/:id/quantity` - Update inventory quantity (admin only)
- `PATCH /api/inventory/:id/adjust` - Adjust inventory quantity (admin only)
- `DELETE /api/inventory/:id` - Delete an inventory item (admin only)

### Delivery

- `GET /api/delivery` - Get all deliveries
- `GET /api/delivery/order/:order_id` - Get delivery by order ID
- `GET /api/delivery/status/:status` - Get deliveries by status
- `GET /api/delivery/driver/:driver_name` - Get deliveries by driver
- `GET /api/delivery/:id` - Get a specific delivery
- `POST /api/delivery` - Create a new delivery
- `PUT /api/delivery/:id` - Update a delivery
- `PATCH /api/delivery/:id/status` - Update delivery status
- `PATCH /api/delivery/:id/assign-driver` - Assign a driver to delivery
- `DELETE /api/delivery/:id` - Delete a delivery

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Admin-only endpoints require the user to have the 'manager' role.

## Sample Data

The seed script includes:
- 17 products across 5 categories
- 7 staff members with different roles
- 16 inventory items
- 5 sample orders with order items
- 5 billing records
- 3 delivery records

**Note**: The seed data uses placeholder password hashes. For testing, you'll need to register new users or update the password hashes in the seed data.

## Database Schema

### Products
- id, name, category, price, created_at, updated_at

### Orders
- id, table_no, waiter_name, order_time, status, created_at, updated_at

### OrderItems
- id, order_id, product_id, quantity, created_at

### Billing
- id, order_id, subtotal, tax, discount, total, payment_method, created_at

### Staff
- id, name, username, password, role, shift, created_at, updated_at

### Inventory
- id, item_name, quantity, unit, created_at, updated_at

### Delivery
- id, order_id, customer_name, address, phone, driver_name, delivery_fee, status, created_at, updated_at

## Error Handling

The API uses standard HTTP status codes:
- 200 - Success
- 201 - Created
- 400 - Bad Request (validation errors)
- 401 - Unauthorized (invalid/missing token)
- 403 - Forbidden (insufficient permissions)
- 404 - Not Found
- 500 - Internal Server Error

Error responses include a descriptive error message.

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control (RBAC)
- Input validation on all endpoints
- CORS enabled for cross-origin requests
- Environment variable configuration

## Development

The server runs on port 3000 by default. You can change this in the `.env` file.

For development with auto-reload:
```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Change the `JWT_SECRET` to a strong, random value
3. Use a process manager like PM2 for production
4. Consider using a production-grade database for scaling

## License

ISC
