-- Clean schema for bus_booking (customers + admins separated)
-- This script drops existing tables if they exist (use with caution).

CREATE DATABASE IF NOT EXISTS bus_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bus_booking;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS trip_seats;
DROP TABLE IF EXISTS trip_dropoff_points;
DROP TABLE IF EXISTS trip_pickup_points;
DROP TABLE IF EXISTS route_dropoff_points;
DROP TABLE IF EXISTS route_pickup_points;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS bus_types;
DROP TABLE IF EXISTS bus_companies;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS customers;

SET FOREIGN_KEY_CHECKS = 1;

-- Customers
CREATE TABLE customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admins
CREATE TABLE admins (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  bus_company_id BIGINT NULL,
  role ENUM('admin','super_admin') DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bus companies
CREATE TABLE bus_companies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  address VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE admins
  ADD CONSTRAINT fk_admins_bus_company
  FOREIGN KEY (bus_company_id) REFERENCES bus_companies(id);

-- Cities
CREATE TABLE cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes
CREATE TABLE routes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bus_company_id BIGINT NOT NULL,
  departure_city_id INT NOT NULL,
  arrival_city_id INT NOT NULL,
  distance_km INT,
  estimated_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_routes_company FOREIGN KEY (bus_company_id) REFERENCES bus_companies(id),
  CONSTRAINT fk_routes_departure_city FOREIGN KEY (departure_city_id) REFERENCES cities(id),
  CONSTRAINT fk_routes_arrival_city FOREIGN KEY (arrival_city_id) REFERENCES cities(id)
);

-- Route pickup points (master points by route)
CREATE TABLE route_pickup_points (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route_id BIGINT NOT NULL,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NULL,
  time_offset_min INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_route_pickup_points_route FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- Route dropoff points (master points by route)
CREATE TABLE route_dropoff_points (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route_id BIGINT NOT NULL,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NULL,
  time_offset_min INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_route_dropoff_points_route FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- Bus types
CREATE TABLE bus_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  floors INT NOT NULL,
  row_count INT NOT NULL,
  col_count INT NOT NULL,
  total_seats INT NOT NULL,
  seat_type ENUM('seat','bed','vip') DEFAULT 'seat',
  layout VARCHAR(50),
  seat_map_template JSON NULL
);

-- Buses
CREATE TABLE buses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bus_company_id BIGINT NOT NULL,
  bus_type_id INT NOT NULL,
  name VARCHAR(100),
  license_plate VARCHAR(20) UNIQUE,
  status ENUM('active','maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_buses_company FOREIGN KEY (bus_company_id) REFERENCES bus_companies(id),
  CONSTRAINT fk_buses_type FOREIGN KEY (bus_type_id) REFERENCES bus_types(id)
);

-- Seats
CREATE TABLE seats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bus_id BIGINT,
  seat_number VARCHAR(10),
  floor INT,
  row_index INT,
  col_index INT,
  is_aisle BOOLEAN DEFAULT FALSE,
  seat_type ENUM('seat','bed','vip'),
  status ENUM('available','booked','locked') DEFAULT 'available',
  CONSTRAINT fk_seats_bus FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- Trips
CREATE TABLE trips (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bus_id BIGINT NOT NULL,
  route_id BIGINT NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME,
  price DECIMAL(10,2) NOT NULL,
  status ENUM('open','closed','cancelled') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_trips_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
  CONSTRAINT fk_trips_route FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- Trip pickup points
CREATE TABLE trip_pickup_points (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  trip_id BIGINT NOT NULL,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NULL,
  time_offset_min INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_trip_pickup_points_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
);

-- Trip dropoff points
CREATE TABLE trip_dropoff_points (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  trip_id BIGINT NOT NULL,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NULL,
  time_offset_min INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_trip_dropoff_points_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
);

-- Trip seats
CREATE TABLE trip_seats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  trip_id BIGINT NOT NULL,
  seat_id BIGINT NOT NULL,
  status ENUM('available','booked','locked') DEFAULT 'available',
  is_vip BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_trip_seats_trip FOREIGN KEY (trip_id) REFERENCES trips(id),
  CONSTRAINT fk_trip_seats_seat FOREIGN KEY (seat_id) REFERENCES seats(id),
  UNIQUE (trip_id, seat_id)
);

-- Bookings
CREATE TABLE bookings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  trip_id BIGINT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('pending','confirmed','cancelled','expired') DEFAULT 'confirmed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_bookings_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
);

-- Tickets (each seat = one ticket)
CREATE TABLE tickets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  trip_id BIGINT NOT NULL,
  seat_id BIGINT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status ENUM('reserved','confirmed','cancelled') DEFAULT 'confirmed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_tickets_trip FOREIGN KEY (trip_id) REFERENCES trips(id),
  CONSTRAINT fk_tickets_seat FOREIGN KEY (seat_id) REFERENCES seats(id),
  UNIQUE (trip_id, seat_id)
);

-- Helpful indexes
CREATE INDEX idx_trips_route_date ON trips (route_id, departure_time);
CREATE INDEX idx_trip_seats_trip_status ON trip_seats (trip_id, status);
CREATE INDEX idx_trip_seats_trip_vip ON trip_seats (trip_id, is_vip);
CREATE INDEX idx_seats_bus ON seats (bus_id);
CREATE INDEX idx_tickets_booking ON tickets (booking_id);
CREATE INDEX idx_trip_pickup_points_trip ON trip_pickup_points (trip_id, is_active);
CREATE INDEX idx_trip_dropoff_points_trip ON trip_dropoff_points (trip_id, is_active);
CREATE INDEX idx_route_pickup_points_route ON route_pickup_points (route_id, is_active);
CREATE INDEX idx_route_dropoff_points_route ON route_dropoff_points (route_id, is_active);

-- Migration-safe additions
ALTER TABLE buses
  ADD COLUMN image_url VARCHAR(255) NULL AFTER license_plate;



