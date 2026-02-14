-- ThaparMarket Database Schema
-- PostgreSQL Database for Campus Marketplace

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  year INTEGER CHECK (year >= 1 AND year <= 5),
  hostel VARCHAR(100),
  profile_picture TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expiry TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  trust_score DECIMAL(3,2) DEFAULT 0.00 CHECK (trust_score >= 0 AND trust_score <= 5),
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('buy_sell', 'rental', 'lost_found')),
  icon VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category_id INTEGER REFERENCES categories(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) CHECK (price >= 0),
  rental_rate DECIMAL(10,2) CHECK (rental_rate >= 0),
  rental_period VARCHAR(50) CHECK (rental_period IN ('hourly', 'daily', 'weekly', 'monthly')),
  condition VARCHAR(50) CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  location VARCHAR(255),
  images TEXT[] DEFAULT '{}',
  listing_type VARCHAR(50) NOT NULL CHECK (listing_type IN ('sell', 'rent', 'lost', 'found')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'rented', 'expired', 'deleted', 'pending')),
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rated_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rated_user_id, rater_id, listing_id)
);

-- Favorites table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  CHECK (reported_user_id IS NOT NULL OR reported_listing_id IS NOT NULL)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('message', 'listing', 'rating', 'admin', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_verified ON users(is_verified);
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_listing_type ON listings(listing_type);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_listing_id ON messages(listing_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_ratings_rated_user_id ON ratings(rated_user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Full-text search index for listings
CREATE INDEX idx_listings_search ON listings 
  USING GIN (to_tsvector('english', title || ' ' || description));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate user trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  avg_rating DECIMAL;
  rating_count INTEGER;
  trust DECIMAL;
BEGIN
  SELECT AVG(rating), COUNT(*) INTO avg_rating, rating_count
  FROM ratings WHERE rated_user_id = user_uuid;
  
  IF rating_count = 0 THEN
    RETURN 0.00;
  ELSIF rating_count < 5 THEN
    -- Weighted score for users with few ratings
    trust := (avg_rating * rating_count) / 5;
  ELSE
    trust := avg_rating;
  END IF;
  
  RETURN ROUND(trust, 2);
END;
$$ LANGUAGE plpgsql;

-- Insert default categories
INSERT INTO categories (name, type, icon, description) VALUES
  ('Electronics', 'buy_sell', '📱', 'Phones, laptops, gadgets'),
  ('Books & Study Material', 'buy_sell', '📚', 'Textbooks, novels, notes'),
  ('Furniture', 'buy_sell', '🪑', 'Chairs, tables, beds'),
  ('Clothing', 'buy_sell', '👕', 'Clothes, shoes, fashion'),
  ('Accessories', 'buy_sell', '🎒', 'Bags, watches, jewelry'),
  ('Bikes & Transport', 'buy_sell', '🚲', 'Bicycles, scooters, vehicles'),
  ('Sports Equipment', 'buy_sell', '⚽', 'Sports gear and equipment'),
  ('Musical Instruments', 'buy_sell', '🎸', 'Guitars, keyboards, etc.'),
  ('Personal Items', 'buy_sell', '👜', 'Wallets, keys, ID cards'),
  ('Stationery', 'buy_sell', '✏️', 'Pens, notebooks, supplies'),
  ('Miscellaneous', 'buy_sell', '📦', 'Other items');
