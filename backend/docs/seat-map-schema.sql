-- Seat map schema (Vexere-like dynamic layout)
-- Compatible with current project naming (row_index/col_index, locked status)

CREATE TABLE IF NOT EXISTS seats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bus_id BIGINT NOT NULL,
  seat_number VARCHAR(20) NOT NULL,
  floor INT NOT NULL DEFAULT 1,
  row_index INT NOT NULL,
  col_index INT NOT NULL,
  seat_type ENUM('seat','bed','vip','cabin') DEFAULT 'seat',
  status ENUM('available','booked','locked') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_seats_bus FOREIGN KEY (bus_id) REFERENCES buses(id),
  UNIQUE KEY uq_bus_seat_number (bus_id, seat_number)
);

CREATE TABLE IF NOT EXISTS trip_seats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  trip_id BIGINT NOT NULL,
  seat_id BIGINT NOT NULL,
  status ENUM('available','booked','locked') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_trip_seats_trip FOREIGN KEY (trip_id) REFERENCES trips(id),
  CONSTRAINT fk_trip_seats_seat FOREIGN KEY (seat_id) REFERENCES seats(id),
  UNIQUE KEY uq_trip_seat (trip_id, seat_id)
);

-- Optional: if you want exact API naming status = selected, use this migration:
-- ALTER TABLE trip_seats MODIFY status ENUM('available','booked','selected') DEFAULT 'available';
-- ALTER TABLE seats MODIFY status ENUM('available','booked','selected') DEFAULT 'available';

-- Useful indexes
CREATE INDEX idx_seats_bus_floor_row_col ON seats (bus_id, floor, row_index, col_index);
CREATE INDEX idx_trip_seats_trip_status ON trip_seats (trip_id, status);
