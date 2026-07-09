-- PizzaHub POS System Seed Data

-- Insert Products (Prices in Pakistani Rupee)
INSERT INTO Products (name, category, base_price) VALUES
('Margherita Pizza', 'Pizza', 1200),
('Pepperoni Pizza', 'Pizza', 1400),
('Hawaiian Pizza', 'Pizza', 1500),
('BBQ Chicken Pizza', 'Pizza', 1600),
('Vegetarian Pizza', 'Pizza', 1300),
('Caesar Salad', 'Salad', 800),
('Greek Salad', 'Salad', 900),
('Garlic Bread', 'Appetizer', 500),
('Chicken Wings', 'Appetizer', 1100),
('Mozzarella Sticks', 'Appetizer', 700),
('Coca-Cola', 'Beverage', 200),
('Sprite', 'Beverage', 200),
('Water', 'Beverage', 150),
('Iced Tea', 'Beverage', 250),
('Tiramisu', 'Dessert', 600),
('Cheesecake', 'Dessert', 700),
('Chocolate Cake', 'Dessert', 650);

-- Insert Staff (passwords are bcrypt hashed for 'password123')
INSERT INTO Staff (name, username, password, role, shift) VALUES
('John Smith', 'john', '$2a$10$05wyRcL31VoPVwow.gptkuPZOu22EomUtVZhiRAKpxOxRL59yrVsu', 'manager', 'morning'),
('Sarah Johnson', 'sarah', '$2a$10$SLUMzZJt7pXcoQQWXrX/Ke7cAJaQtzzHyuc40W7n0azuNKtVLcT0m', 'waiter', 'morning'),
('Mike Williams', 'mike', '$2a$10$75UObzubeWGIrIaGqSF0s.triSDneUYquZIoj7DrGCQpl5.GEiq/O', 'waiter', 'evening'),
('Emily Brown', 'emily', '$2a$10$EL0CVdk1quMdAbr2YyNHZOWMzYs/IWpclRhUAIJdmAKtiUHEX9yqW', 'chef', 'morning'),
('David Davis', 'david', '$2a$10$hawIdycrvi4sx0gjjrb7CemWik0Sc4IsliytVR/gdj1rJzqgAs.5a', 'chef', 'evening'),
('Lisa Wilson', 'lisa', '$2a$10$7dQq6n4QnC6s7o4PSLClHOa9lGptNDVc8MIX2ox.F82ac05ymxhKy', 'cashier', 'morning'),
('Tom Miller', 'tom', '$2a$10$ryxX3.qPojzld4Ro/sBBAuWhrrd.AsF02.sf.dWzVyTn1IKnf7KRy', 'driver', 'evening');

-- Insert Inventory
INSERT INTO Inventory (item_name, quantity, unit) VALUES
('Pizza Dough', 100, 'kg'),
('Tomato Sauce', 50, 'liters'),
('Mozzarella Cheese', 30, 'kg'),
('Pepperoni', 20, 'kg'),
('Chicken', 25, 'kg'),
('Pineapple', 15, 'kg'),
('Lettuce', 10, 'kg'),
('Olive Oil', 20, 'liters'),
('Garlic', 5, 'kg'),
('Chicken Wings', 15, 'kg'),
('Coca-Cola', 100, 'bottles'),
('Sprite', 100, 'bottles'),
('Water', 150, 'bottles'),
('Iced Tea', 80, 'bottles'),
('Flour', 50, 'kg'),
('Sugar', 30, 'kg'),
('Eggs', 100, 'pieces');

-- Insert Sample Orders
INSERT INTO Orders (table_no, waiter_name, status) VALUES
(1, 'Sarah Johnson', 'completed'),
(2, 'Sarah Johnson', 'completed'),
(3, 'Mike Williams', 'in_progress'),
(4, 'Mike Williams', 'pending'),
(5, 'Sarah Johnson', 'pending');

-- Insert Sample OrderItems
INSERT INTO OrderItems (order_id, product_id, quantity) VALUES
(1, 1, 2),
(1, 8, 1),
(1, 11, 4),
(2, 2, 1),
(2, 7, 1),
(2, 12, 2),
(3, 3, 1),
(3, 9, 2),
(3, 13, 3),
(4, 4, 1),
(4, 6, 1),
(5, 5, 2),
(5, 10, 1);

-- Insert Sample Billing (Amounts in Pakistani Rupee)
INSERT INTO Billing (order_id, subtotal, tax, discount, total, payment_method) VALUES
(1, 3800, 304, 0, 4104, 'cash'),
(2, 2900, 232, 500, 2632, 'card'),
(3, 4600, 368, 0, 4968, 'card'),
(4, 2600, 208, 0, 2808, 'cash'),
(5, 3600, 288, 0, 3888, 'card');

-- Insert Sample Delivery (Delivery fee in Pakistani Rupee)
INSERT INTO Delivery (order_id, customer_name, address, phone, driver_name, delivery_fee, status) VALUES
(3, 'Alice Johnson', '123 Main Street, Apt 4B', '555-0101', 'Tom Miller', 300, 'delivered'),
(4, 'Bob Smith', '456 Oak Avenue', '555-0102', 'Tom Miller', 400, 'in_transit'),
(5, 'Carol White', '789 Pine Road', '555-0103', NULL, 300, 'pending');

-- Insert Sample Expenses
INSERT INTO Expenses (category, description, amount, expense_date) VALUES
('Rent', 'Shop monthly rent', 250000.00, '2026-07-01 09:00:00'),
('Salaries', 'Staff salary payout', 180000.00, '2026-07-05 10:00:00'),
('Utilities', 'Electricity and water bill', 42000.00, '2026-07-03 12:00:00'),
('Supplies', 'Kitchen supplies and packaging', 56000.00, '2026-07-06 08:30:00');
