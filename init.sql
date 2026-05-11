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

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id SERIAL PRIMARY KEY,
  nip VARCHAR(50) REFERENCES employees(nip),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(10) CHECK (type IN ('in', 'out')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  office_name VARCHAR(100),
  distance_meters INTEGER
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  nip VARCHAR(50) REFERENCES employees(nip),
  leave_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'Pending',
  delegate_nip VARCHAR(50),
  approved_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  holiday_date DATE UNIQUE NOT NULL,
  description VARCHAR(200)
);

-- Insert admin user (Password Admin123)
INSERT INTO users (username, password, role) VALUES ('admin', 'Admin123', 'admin') ON CONFLICT (username) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES (
  'app_settings', 
  '{"lat": -6.2088, "lng": 106.8456, "radius": 50, "tolerance": 15, "shiftStart": "08:00", "shiftEnd": "17:00", "offices": []}'
) ON CONFLICT (key) DO NOTHING;
