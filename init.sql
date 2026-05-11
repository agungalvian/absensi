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
  shift VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL
);

-- Insert admin user (Password Admin123)
INSERT INTO users (username, password, role) VALUES ('admin', 'Admin123', 'admin') ON CONFLICT (username) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES (
  'app_settings', 
  '{"lat": -6.2088, "lng": 106.8456, "radius": 50, "tolerance": 15, "shiftStart": "08:00", "shiftEnd": "17:00"}'
) ON CONFLICT (key) DO NOTHING;

-- Insert dummy employees
INSERT INTO employees (nip, name, department, position, join_date, shift) VALUES 
('123456', 'John Doe', 'IT', 'Software Engineer', '2023-01-15', 'Pagi (08:00 - 17:00)'),
('123457', 'Jane Smith', 'HR', 'HR Manager', '2022-05-10', 'Pagi (08:00 - 17:00)'),
('123458', 'Bob Johnson', 'Finance', 'Accountant', '2023-03-20', 'Pagi (08:00 - 17:00)')
ON CONFLICT (nip) DO NOTHING;
