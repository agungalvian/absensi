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
