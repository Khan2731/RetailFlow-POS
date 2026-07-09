-- Settings table for restaurant configuration
CREATE TABLE IF NOT EXISTS Settings (
    id SERIAL PRIMARY KEY,
    restaurant_name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
