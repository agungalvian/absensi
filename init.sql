-- Drop existing tables to ensure clean state if needed (optional)
-- DROP TABLE IF EXISTS holidays;
-- DROP TABLE IF EXISTS leave_requests;
-- DROP TABLE IF EXISTS attendance_logs;
-- DROP TABLE IF EXISTS settings;
-- DROP TABLE IF EXISTS employees;
-- DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS employees (
  nip VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  position VARCHAR(50),
  join_date DATE,
  password VARCHAR(255) DEFAULT 'Pegawai123',
  roles VARCHAR(100) DEFAULT 'pegawai',
  manager_nip VARCHAR(50),
  leave_quota INTEGER DEFAULT 12,
  leave_carry_over INTEGER DEFAULT 0
);

-- Add self-reference for manager
ALTER TABLE employees ADD CONSTRAINT fk_manager FOREIGN KEY (manager_nip) REFERENCES employees(nip) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id SERIAL PRIMARY KEY,
  nip VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(10) CHECK (type IN ('in', 'out')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  office_name VARCHAR(100),
  distance_meters INTEGER,
  CONSTRAINT fk_attendance_employee FOREIGN KEY (nip) REFERENCES employees(nip) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  nip VARCHAR(50) NOT NULL,
  leave_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'Pending',
  delegate_nip VARCHAR(50),
  approved_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_leave_employee FOREIGN KEY (nip) REFERENCES employees(nip) ON DELETE CASCADE,
  CONSTRAINT fk_leave_delegate FOREIGN KEY (delegate_nip) REFERENCES employees(nip) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  holiday_date DATE UNIQUE NOT NULL,
  description VARCHAR(200)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_nip ON attendance_logs(nip);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_leave_nip ON leave_requests(nip);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

-- Insert admin user (Password Admin123)
INSERT INTO users (username, password, role) VALUES ('admin', 'Admin123', 'admin') ON CONFLICT (username) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES (
  'app_settings', 
  '{"lat": -6.2088, "lng": 106.8456, "radius": 50, "tolerance": 15, "shiftStart": "08:00", "shiftEnd": "17:00", "offices": []}'
) ON CONFLICT (key) DO NOTHING;
