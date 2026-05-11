import express from 'express';
import pg from 'pg';
import cors from 'cors';
const { Pool } = pg;

const app = express();
const port = 3201;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'absensi',
  password: process.env.DB_PASSWORD || 'Admin123',
  port: process.env.DB_PORT || 5432,
});

// Initialize Database Schema
const initDb = async () => {
  try {
    await pool.query(`
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

      ALTER TABLE employees ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'Pegawai123';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS roles VARCHAR(100) DEFAULT 'pegawai';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_nip VARCHAR(50);
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS leave_quota INTEGER DEFAULT 12;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS leave_carry_over INTEGER DEFAULT 0;

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

      INSERT INTO users (username, password, role) VALUES ('admin', 'Admin123', 'admin') ON CONFLICT (username) DO NOTHING;
      
      INSERT INTO settings (key, value) VALUES (
        'app_settings', 
        '{"lat": -6.2088, "lng": 106.8456, "radius": 50, "tolerance": 15, "shiftStart": "08:00", "shiftEnd": "17:00", "offices": []}'
      ) ON CONFLICT (key) DO NOTHING;
    `);
    console.log('Database schema initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

initDb();

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (userResult.rows.length > 0) {
      return res.json({ success: true });
    }
    
    const empResult = await pool.query("SELECT * FROM employees WHERE nip = $1 AND password = $2 AND roles LIKE '%admin%'", [username, password]);
    if (empResult.rows.length > 0) {
      return res.json({ success: true });
    }
    
    res.status(401).json({ success: false, message: 'Invalid credentials or missing admin privileges' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mobile Login (Employee)
app.post('/api/mobile/login', async (req, res) => {
  const { nip, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM employees WHERE nip = $1 AND password = $2', [nip, password]);
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'NIP atau Password salah' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Settings
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM settings WHERE key = 'app_settings'");
    if (result.rows.length > 0) {
      res.json(result.rows[0].value);
    } else {
      res.json({});
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Settings
app.post('/api/settings', async (req, res) => {
  const settings = req.body;
  try {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('app_settings', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [settings]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Employees
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM employees ORDER BY join_date DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Employee
app.post('/api/employees', async (req, res) => {
  const { nip, name, department, position, join_date, password, roles, manager_nip, leave_quota, leave_carry_over } = req.body;
  try {
    await pool.query(
      'INSERT INTO employees (nip, name, department, position, join_date, password, roles, manager_nip, leave_quota, leave_carry_over) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [nip, name, department, position, join_date, password || 'Pegawai123', roles || 'pegawai', manager_nip || null, leave_quota || 12, leave_carry_over || 0]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Employee
app.put('/api/employees/:nip', async (req, res) => {
  const { nip } = req.params;
  const { name, department, position, join_date, password, roles, manager_nip, leave_quota, leave_carry_over } = req.body;
  try {
    let query;
    let params;
    
    if (password && password.trim() !== '') {
      query = 'UPDATE employees SET name=$1, department=$2, position=$3, join_date=$4, password=$5, roles=$6, manager_nip=$7, leave_quota=$8, leave_carry_over=$9 WHERE nip=$10';
      params = [name, department, position, join_date, password, roles, manager_nip || null, leave_quota || 12, leave_carry_over || 0, nip];
    } else {
      query = 'UPDATE employees SET name=$1, department=$2, position=$3, join_date=$4, roles=$5, manager_nip=$6, leave_quota=$7, leave_carry_over=$8 WHERE nip=$9';
      params = [name, department, position, join_date, roles, manager_nip || null, leave_quota || 12, leave_carry_over || 0, nip];
    }
    
    await pool.query(query, params);
    res.json({ success: true });
  } catch (err) {
    console.error('Update Employee Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Employee
app.delete('/api/employees/:nip', async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE nip = $1', [req.params.nip]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function calculateLeaveDays(startDate, endDate, pool) {
  const result = await pool.query('SELECT holiday_date FROM holidays WHERE holiday_date >= $1 AND holiday_date <= $2', [startDate, endDate]);
  const holidays = result.rows.map(r => {
    const d = new Date(r.holiday_date);
    return d.toISOString().split('T')[0];
  });
  
  let current = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  
  while(current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// Holidays CRUD
app.get('/api/holidays', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM holidays ORDER BY holiday_date ASC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/holidays', async (req, res) => {
  const { holiday_date, description } = req.body;
  try {
    await pool.query('INSERT INTO holidays (holiday_date, description) VALUES ($1, $2)', [holiday_date, description]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/holidays/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM holidays WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Leave API
app.post('/api/leaves', async (req, res) => {
  const { nip, leave_type, start_date, end_date, reason, delegate_nip } = req.body;
  
  if (leave_type === 'Cuti Tahunan') {
    const today = new Date();
    const start = new Date(start_date);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return res.status(400).json({ success: false, message: 'Cuti Tahunan harus diajukan minimal H-7' });
    }
  }
  
  const days = await calculateLeaveDays(start_date, end_date, pool);
  if (days === 0) return res.status(400).json({ success: false, message: 'Tidak ada hari kerja pada rentang tanggal tersebut' });
  
  if (leave_type === 'Cuti Tahunan') {
    const emp = await pool.query('SELECT leave_quota, leave_carry_over FROM employees WHERE nip = $1', [nip]);
    const totalQuota = (emp.rows[0].leave_quota || 0) + (emp.rows[0].leave_carry_over || 0);
    if (days > totalQuota) return res.status(400).json({ success: false, message: `Sisa cuti tidak mencukupi. Kuota: ${totalQuota}, Pengajuan: ${days}` });
  }

  try {
    await pool.query(
      'INSERT INTO leave_requests (nip, leave_type, start_date, end_date, reason, delegate_nip) VALUES ($1, $2, $3, $4, $5, $6)',
      [nip, leave_type, start_date, end_date, reason, delegate_nip || null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leaves/me/:nip', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM leave_requests WHERE nip = $1 ORDER BY created_at DESC", [req.params.nip]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/leaves', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, e.name as employee_name, e.manager_nip 
      FROM leave_requests l 
      JOIN employees e ON l.nip = e.nip 
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/leaves/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { status, approved_by } = req.body; 
  
  try {
    if (status === 'Approved') {
      const leave = await pool.query('SELECT nip, leave_type, start_date, end_date FROM leave_requests WHERE id = $1', [id]);
      const l = leave.rows[0];
      if (l.leave_type === 'Cuti Tahunan') {
        const days = await calculateLeaveDays(l.start_date, l.end_date, pool);
        await pool.query('UPDATE employees SET leave_quota = leave_quota - $1 WHERE nip = $2', [days, l.nip]);
      }
    }
    
    await pool.query('UPDATE leave_requests SET status = $1, approved_by = $2 WHERE id = $3', [status, approved_by, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance API
app.post('/api/attendance', async (req, res) => {
  const { nip, type, location_lat, location_lng, office_name, distance_meters } = req.body;
  try {
    await pool.query(
      'INSERT INTO attendance_logs (nip, type, location_lat, location_lng, office_name, distance_meters) VALUES ($1, $2, $3, $4, $5, $6)',
      [nip, type, location_lat, location_lng, office_name, distance_meters]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance/me/:nip', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attendance_logs WHERE nip = $1 ORDER BY timestamp DESC', [req.params.nip]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const totalEmployees = await pool.query("SELECT COUNT(*) FROM employees");
    const presentToday = await pool.query("SELECT COUNT(DISTINCT nip) FROM attendance_logs WHERE type = 'in' AND timestamp::date = CURRENT_DATE");
    const onLeave = await pool.query("SELECT COUNT(DISTINCT nip) FROM leave_requests WHERE status = 'Approved' AND CURRENT_DATE BETWEEN start_date AND end_date");
    const recentActivity = await pool.query(`
      SELECT l.*, e.name as employee_name 
      FROM attendance_logs l 
      JOIN employees e ON l.nip = e.nip 
      ORDER BY l.timestamp DESC LIMIT 10
    `);
    
    res.json({
      totalEmployees: parseInt(totalEmployees.rows[0].count),
      presentToday: parseInt(presentToday.rows[0].count),
      onLeave: parseInt(onLeave.rows[0].count),
      recentActivity: recentActivity.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password API
app.post('/api/change-password', async (req, res) => {
  const { nip, oldPassword, newPassword } = req.body;
  try {
    // Check in employees table
    const empResult = await pool.query('SELECT * FROM employees WHERE nip = $1 AND password = $2', [nip, oldPassword]);
    if (empResult.rows.length > 0) {
      await pool.query('UPDATE employees SET password = $1 WHERE nip = $2', [newPassword, nip]);
      return res.json({ success: true });
    }
    
    // Check in admin users table
    const adminResult = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [nip, oldPassword]);
    if (adminResult.rows.length > 0) {
      await pool.query('UPDATE users SET password = $1 WHERE username = $2', [newPassword, nip]);
      return res.json({ success: true });
    }
    
    res.status(401).json({ success: false, message: 'Password lama salah' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend API running on port ${port}`);
});
