import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  Calendar as CalendarIcon, 
  Clock, 
  LogOut, 
  Lock, 
  BarChart3, 
  Download, 
  Upload, 
  Plus, 
  Trash, 
  Search, 
  Filter 
} from 'lucide-react';

function Sidebar({ onLogout, onChangePassword }) {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { path: '/office', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/office/employees', icon: <Users size={20} />, label: 'Data Pegawai' },
  ];

  return (
    <div className="sidebar p-6 flex flex-col h-full">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="mb-4" style={{ width: '80px', height: '80px' }}>
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-bold text-xl text-primary tracking-tight">BackOffice</h1>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {links.map((link) => (
          <button
            key={link.path}
            className={`sidebar-link w-full text-left bg-transparent border-none cursor-pointer ${location.pathname === link.path ? 'active' : ''}`}
            onClick={() => navigate(link.path)}
          >
            {link.icon}
            <span>{link.label}</span>
          </button>
        ))}
        <button
          className={`sidebar-link w-full text-left bg-transparent border-none cursor-pointer ${location.pathname === '/office/leaves' ? 'active' : ''}`}
          onClick={() => navigate('/office/leaves')}
        >
          <CalendarIcon size={20} />
          <span>Persetujuan Cuti/Izin</span>
        </button>
        <button
          className={`sidebar-link w-full text-left bg-transparent border-none cursor-pointer ${location.pathname === '/office/reports' ? 'active' : ''}`}
          onClick={() => navigate('/office/reports')}
        >
          <BarChart3 size={20} />
          <span>Laporan Presensi</span>
        </button>
        <button
          className={`sidebar-link w-full text-left bg-transparent border-none cursor-pointer ${location.pathname === '/office/settings' ? 'active' : ''}`}
          onClick={() => navigate('/office/settings')}
        >
          <SettingsIcon size={20} />
          <span>Parameter & Geofence</span>
        </button>
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-border/50">
        <button className="sidebar-link w-full text-left bg-transparent border-none cursor-pointer" onClick={onChangePassword}>
          <Lock size={20} />
          <span>Ganti Password</span>
        </button>
        <button className="sidebar-link w-full text-left bg-transparent border-none cursor-pointer" onClick={onLogout}>
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose, username }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Password baru dan konfirmasi tidak cocok');
      return;
    }

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: username, oldPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert('Password berhasil diganti');
        onClose();
      } else {
        alert(data.message || 'Gagal mengganti password');
      }
    } catch (err) {
      alert('Terjadi kesalahan pada server');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Lock className="text-primary" />
          Ganti Password
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group mb-0">
            <label className="form-label">Password Lama</label>
            <input type="password" name="old" className="form-control" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Password Baru</label>
            <input type="password" name="new" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Konfirmasi Password Baru</label>
            <input type="password" name="confirm" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ totalEmployees: 0, presentToday: 0, onLeave: 0, recentActivity: [] });

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
    
    const interval = setInterval(() => {
      fetch('/api/dashboard-stats')
        .then(res => res.json())
        .then(data => setStats(data));
    }, 10000); // Auto refresh every 10s
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Real-time Dashboard</h2>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card text-center flex flex-col items-center">
          <h3 className="text-muted mb-2">Total Pegawai</h3>
          <p className="text-3xl font-bold">{stats.totalEmployees}</p>
        </div>
        <div className="card text-center flex flex-col items-center">
          <h3 className="text-muted mb-2">Hadir Hari Ini</h3>
          <p className="text-3xl font-bold text-secondary">{stats.presentToday}</p>
        </div>
        <div className="card text-center flex flex-col items-center">
          <h3 className="text-muted mb-2">Sedang Cuti/Izin</h3>
          <p className="text-3xl font-bold text-primary">{stats?.onLeave || 0}</p>
        </div>
        <div className="card text-center flex flex-col items-center">
          <h3 className="text-muted mb-2">Tanpa Keterangan</h3>
          <p className="text-3xl font-bold text-danger">{Math.max(0, (stats?.totalEmployees || 0) - (stats?.presentToday || 0) - (stats?.onLeave || 0))}</p>
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-4">Aktivitas Absensi Terbaru</h3>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover">
            <tr>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted">Nama Pegawai</th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted">Waktu</th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted">Tipe</th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted">Lokasi / Jarak</th>
            </tr>
          </thead>
          <tbody>
            {(stats?.recentActivity || []).map(act => (
              <tr key={act.id} className="border-t border-border hover:bg-surface-hover/50 transition-colors">
                <td className="p-4 font-semibold">{act?.employee_name || '-'}</td>
                <td className="p-4">{act?.timestamp ? new Date(act.timestamp).toLocaleTimeString('id-ID') : '-'}</td>
                <td className="p-4">
                  <span className={`status-badge ${act?.type === 'in' ? 'status-success' : 'status-danger'}`}>
                    {act?.type === 'in' ? 'Masuk' : 'Pulang'}
                  </span>
                </td>
                <td className="p-4 text-sm text-muted">{act?.office_name} ({act?.distance_meters}m)</td>
              </tr>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-muted">Belum ada aktivitas hari ini</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nip: '', name: '', department: '', position: '', join_date: '', password: '', roles: 'pegawai', manager_nip: '', leave_quota: 12, leave_carry_over: 0
  });
  const [isEdit, setIsEdit] = useState(false);

  const fetchEmployees = () => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEmployees(data);
        else setEmployees([]);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const url = isEdit ? `/api/employees/${formData.nip}` : '/api/employees';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchEmployees();
      } else {
        alert('Gagal menyimpan data');
      }
    } catch (err) {
      alert('Terjadi kesalahan server');
    }
  };

  const openAdd = () => {
    setFormData({ nip: '', name: '', department: '', position: '', join_date: '', password: '', roles: 'pegawai', manager_nip: '', leave_quota: 12, leave_carry_over: 0 });
    setIsEdit(false);
    setShowModal(true);
  };

  const openEdit = (emp) => {
    let joinDate = '';
    if (emp.join_date) {
      const d = new Date(emp.join_date);
      if (!isNaN(d.getTime())) {
        joinDate = d.toISOString().split('T')[0];
      }
    }
    setFormData({ ...emp, join_date: joinDate });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDelete = async (nip) => {
    if (confirm('Yakin ingin menghapus pegawai ini?')) {
      try {
        await fetch(`/api/employees/${nip}`, { method: 'DELETE' });
        fetchEmployees();
      } catch (err) {
        alert('Gagal menghapus');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Data Pegawai</h2>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={openAdd}>+ Tambah Pegawai</button>
          <button className="btn btn-secondary"><Download size={18} /> Export</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>NIP</th>
              <th>Nama</th>
              <th>Departemen</th>
              <th>Posisi</th>
              <th>Role</th>
              <th>Tgl Masuk</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(employees || []).map((emp) => (
              <tr key={emp?.nip || Math.random()}>
                <td>{emp?.nip || '-'}</td>
                <td>{emp?.name || '-'}</td>
                <td>{emp?.department || '-'}</td>
                <td>{emp?.position || '-'}</td>
                <td>{emp?.roles || '-'}</td>
                <td>{emp?.join_date ? new Date(emp.join_date).toLocaleDateString() : '-'}</td>
                <td>
                  <button className="btn btn-secondary p-2 text-xs mr-2" onClick={() => openEdit(emp)}>Edit</button>
                  <button className="btn btn-danger p-2 text-xs" onClick={() => handleDelete(emp?.nip)}>Hapus</button>
                </td>
              </tr>
            ))}
            {(!employees || employees.length === 0) && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-muted">Belum ada data pegawai.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold mb-4">{isEdit ? 'Edit Pegawai' : 'Tambah Pegawai'}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">NIP</label>
                  <input type="text" className="form-control" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} disabled={isEdit} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama</label>
                  <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Departemen</label>
                  <input type="text" className="form-control" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Posisi</label>
                  <input type="text" className="form-control" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Tanggal Masuk</label>
                  <input type="date" className="form-control" value={formData.join_date} onChange={e => setFormData({...formData, join_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password Login</label>
                  <input type="password" name="password" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={isEdit ? "Biarkan jika tak ingin ubah" : "Default: Pegawai123"} required={!isEdit} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="form-group">
                  <label className="form-label">Role Akses</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(formData.roles || '').includes('pegawai')}
                        onChange={(e) => {
                          const rolesArr = (formData.roles || '').split(',').map(r => r.trim()).filter(Boolean);
                          if (e.target.checked) {
                            if (!rolesArr.includes('pegawai')) rolesArr.push('pegawai');
                          } else {
                            const idx = rolesArr.indexOf('pegawai');
                            if (idx > -1) rolesArr.splice(idx, 1);
                          }
                          setFormData({...formData, roles: rolesArr.join(', ')});
                        }}
                      />
                      Pegawai
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(formData.roles || '').includes('admin')}
                        onChange={(e) => {
                          const rolesArr = (formData.roles || '').split(',').map(r => r.trim()).filter(Boolean);
                          if (e.target.checked) {
                            if (!rolesArr.includes('admin')) rolesArr.push('admin');
                          } else {
                            const idx = rolesArr.indexOf('admin');
                            if (idx > -1) rolesArr.splice(idx, 1);
                          }
                          setFormData({...formData, roles: rolesArr.join(', ')});
                        }}
                      />
                      Admin
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">NIP Atasan (Manager)</label>
                  <input type="text" className="form-control" value={formData.manager_nip || ''} onChange={e => setFormData({...formData, manager_nip: e.target.value})} placeholder="Opsional" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kuota Cuti Tahunan</label>
                  <input type="number" className="form-control" value={formData.leave_quota} onChange={e => setFormData({...formData, leave_quota: parseInt(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Sisa Cuti Thn Lalu</label>
                  <input type="number" className="form-control" value={formData.leave_carry_over} onChange={e => setFormData({...formData, leave_carry_over: parseInt(e.target.value)})} required />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaveApproval() {
  const [leaves, setLeaves] = useState([]);

  const fetchLeaves = () => {
    fetch('/api/leaves')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeaves(data);
        else setLeaves([]);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleAction = async (id, status) => {
    if (confirm(`Yakin ingin ${status === 'Approved' ? 'menyetujui' : 'menolak'} pengajuan ini?`)) {
      try {
        await fetch(`/api/leaves/${id}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, approved_by: 'Admin' })
        });
        fetchLeaves();
      } catch (err) { alert('Terjadi kesalahan server'); }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Persetujuan Cuti & Izin</h2>
      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Pegawai</th>
              <th>Jenis</th>
              <th>Mulai</th>
              <th>Selesai</th>
              <th>Alasan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(leaves || []).map((l) => (
              <tr key={l?.id || Math.random()}>
                <td>{l?.employee_name || '-'} ({l?.nip || '-'})</td>
                <td>{l?.leave_type || '-'}</td>
                <td>{l?.start_date ? new Date(l.start_date).toLocaleDateString() : '-'}</td>
                <td>{l?.end_date ? new Date(l.end_date).toLocaleDateString() : '-'}</td>
                <td>{l?.reason || '-'}</td>
                <td>
                  <span className={`status-badge ${l?.status === 'Approved' ? 'status-success' : l?.status === 'Rejected' ? 'status-danger' : 'status-warning'}`}>
                    {l?.status || 'Pending'}
                  </span>
                </td>
                <td>
                  {l?.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button className="btn btn-secondary p-2 text-xs" onClick={() => handleAction(l.id, 'Approved')}>Setuju</button>
                      <button className="btn btn-danger p-2 text-xs" onClick={() => handleAction(l.id, 'Rejected')}>Tolak</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {(!leaves || leaves.length === 0) && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-muted">Belum ada pengajuan cuti/izin.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttendanceReport() {
  const [data, setData] = useState({ employees: [], logs: [], leaves: [], holidays: [] });
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setSettings(data);
        } else {
          setSettings(prev => ({ ...prev, offices: [] }));
        }
      });
  }, []);

  const fetchReport = () => {
    fetch(`/api/reports/attendance?month=${month}&year=${year}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.employees) setData(data);
        else setData({ employees: [], logs: [], leaves: [], holidays: [] });
      });
  };

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getStatus = (nip, day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(dateStr);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const isHoliday = data.holidays.includes(dateStr);

    // 1. Check Leave
    const isOnLeave = data.leaves.some(l => {
      const start = new Date(l.start_date).toLocaleDateString('en-CA'); // YYYY-MM-DD
      const end = new Date(l.end_date).toLocaleDateString('en-CA');
      return l.nip === nip && dateStr >= start && dateStr <= end;
    });
    if (isOnLeave) return 'leave';

    // 2. Check Log
    const log = data.logs.find(l => {
      // l.date is now a string 'YYYY-MM-DD' from the API
      return l.nip === nip && l.date === dateStr;
    });

    if (log) {
      if (!log.first_in || !log.first_out) return 'partial';
      
      const checkInTime = new Date(log.first_in).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const shiftStart = settings.shiftStart || '08:00';
      return checkInTime > shiftStart ? 'late' : 'normal';
    }

    // 3. Check if absent (exclude future dates, weekends, and holidays)
    const today = new Date().toISOString().split('T')[0];
    if (dateStr > today || isWeekend || isHoliday) return 'none';

    return 'absent';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary">Laporan Presensi Bulanan</h2>
        <div className="flex gap-4">
          <select className="form-control w-32" value={month} onChange={e => setMonth(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
            ))}
          </select>
          <select className="form-control w-32" value={year} onChange={e => setYear(e.target.value)}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={fetchReport}>Refresh</button>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-surface-hover">
              <th className="p-3 border border-border sticky left-0 bg-surface z-10 text-left min-w-[150px]">Nama Pegawai</th>
              {days.map(d => (
                <th key={d} className="p-1 border border-border text-center min-w-[32px]">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.employees.map(emp => (
              <tr key={emp.nip} className="hover:bg-surface-hover transition-colors">
                <td className="p-3 border border-border font-medium sticky left-0 bg-surface z-10">{emp.name}</td>
                {days.map(d => {
                  const status = getStatus(emp.nip, d);
                  let color = '';
                  let title = '';
                  if (status === 'normal') { color = 'bg-green-500'; title = 'Masuk Normal'; }
                  else if (status === 'late') { color = 'bg-orange-500'; title = 'Terlambat'; }
                  else if (status === 'partial') { color = 'bg-yellow-400'; title = 'Absen Tidak Lengkap (Hanya Masuk/Pulang)'; }
                  else if (status === 'absent') { color = 'bg-red-500'; title = 'Tanpa Keterangan'; }
                  else if (status === 'leave') { color = 'bg-blue-500'; title = 'Izin/Cuti'; }
                  
                  return (
                    <td key={d} className="p-0 border border-border text-center">
                      <div className={`w-full h-10 ${color} flex items-center justify-center text-[8px]`} title={title}>
                        {status !== 'none' ? status : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-6 text-[11px] text-muted font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded-sm"></div> Masuk Normal</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded-sm"></div> Terlambat</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-400 rounded-sm"></div> Hanya Masuk/Pulang</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-sm"></div> Alpa / Tidak Absen</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded-sm"></div> Izin / Cuti</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-transparent border border-border rounded-sm"></div> Libur / Belum Terjadi</div>
      </div>
    </div>
  );
}

function SettingsComponent() {
  const [settings, setSettings] = useState({
    offices: [{ id: 1, name: 'Kantor Pusat', address: 'Jakarta', lat: -6.2088, lng: 106.8456 }],
    radius: 50,
    tolerance: 15,
    shiftStart: '08:00',
    shiftEnd: '17:00'
  });
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ holiday_date: '', description: '' });

  const fetchHolidays = () => {
    fetch('/api/holidays')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHolidays(data);
        else setHolidays([]);
      });
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          if (!data.offices && data.lat) {
            data.offices = [{ id: 1, name: 'Kantor Utama', address: '-', lat: data.lat, lng: data.lng }];
          }
          if (!data.offices) data.offices = [];
          setSettings(data);
        }
      })
      .catch(err => console.error(err));
    fetchHolidays();
  }, []);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    await fetch('/api/holidays', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newHoliday) });
    setNewHoliday({ holiday_date: '', description: '' });
    fetchHolidays();
  };

  const handleDeleteHoliday = async (id) => {
    await fetch(`/api/holidays/${id}`, { method: 'DELETE' });
    fetchHolidays();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Pengaturan berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan pengaturan.');
    }
  };

  const addOffice = () => {
    setSettings(prev => ({
      ...prev,
      offices: [...(prev.offices || []), { id: Date.now(), name: '', address: '', lat: '', lng: '' }]
    }));
  };

  const removeOffice = (id) => {
    setSettings(prev => ({
      ...prev,
      offices: prev.offices.filter(o => o.id !== id)
    }));
  };

  const updateOffice = (id, field, value) => {
    const processedValue = (field === 'lat' || field === 'lng') ? value.replace(',', '.') : value;
    setSettings(prev => ({
      ...prev,
      offices: prev.offices.map(o => o.id === id ? { ...o, [field]: processedValue } : o)
    }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Parameter & Geofence</h2>
      <div className="card max-w-2xl">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Lokasi Kantor</h3>
              <button type="button" className="btn btn-secondary text-sm" onClick={addOffice}>+ Tambah Kantor</button>
            </div>
            
            {settings.offices?.map((office, idx) => (
              <div key={office.id} className="p-4 border border-border rounded-lg mb-4 bg-background">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-primary">Kantor {idx + 1}</h4>
                  {(settings?.offices?.length || 0) > 1 && (
                    <button type="button" className="btn btn-danger p-2 text-xs" onClick={() => removeOffice(office.id)}>Hapus</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Nama Kantor</label>
                    <input type="text" className="form-control" value={office.name} onChange={(e) => updateOffice(office.id, 'name', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alamat Lengkap</label>
                    <input type="text" className="form-control" value={office.address} onChange={(e) => updateOffice(office.id, 'address', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input type="number" step="any" className="form-control" value={office.lat} onChange={(e) => updateOffice(office.id, 'lat', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input type="number" step="any" className="form-control" value={office.lng} onChange={(e) => updateOffice(office.id, 'lng', e.target.value)} required />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="form-group">
            <label className="form-label">Radius Geofence Maksimal (Meter)</label>
            <input type="number" name="radius" value={settings.radius} onChange={handleChange} className="form-control" required />
            <p className="text-xs text-muted mt-1">Jarak maksimal pegawai dapat melakukan absensi dari titik koordinat kantor.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Jam Masuk</label>
              <input type="time" name="shiftStart" value={settings.shiftStart} onChange={handleChange} className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">Jam Pulang</label>
              <input type="time" name="shiftEnd" value={settings.shiftEnd} onChange={handleChange} className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">Toleransi Telat (Menit)</label>
              <input type="number" name="tolerance" value={settings.tolerance} onChange={handleChange} className="form-control" required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-4 self-start">Simpan Pengaturan</button>
        </form>
      </div>

      <div className="card max-w-2xl mt-8">
        <h3 className="font-bold text-xl mb-4">Pengaturan Hari Libur</h3>
        <p className="text-sm text-muted mb-4">Tambahkan tanggal merah dan cuti bersama di sini. Hari libur ini tidak akan memotong kuota cuti pegawai saat mengajukan cuti.</p>
        
        <form onSubmit={handleAddHoliday} className="flex gap-4 items-end mb-6">
          <div className="form-group mb-0 flex-1">
            <label className="form-label">Tanggal Libur</label>
            <input type="date" className="form-control" value={newHoliday.holiday_date} onChange={e => setNewHoliday({...newHoliday, holiday_date: e.target.value})} required />
          </div>
          <div className="form-group mb-0 flex-1">
            <label className="form-label">Keterangan</label>
            <input type="text" className="form-control" value={newHoliday.description} onChange={e => setNewHoliday({...newHoliday, description: e.target.value})} placeholder="Contoh: Idul Fitri" required />
          </div>
          <button type="submit" className="btn btn-primary h-[42px]">+ Tambah</button>
        </form>

        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-hover">
              <tr>
                <th className="p-3 text-left">Tanggal</th>
                <th className="p-3 text-left">Keterangan</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(holidays || []).map(h => (
                <tr key={h?.id || Math.random()} className="border-t border-border">
                  <td className="p-3">{h?.holiday_date ? new Date(h.holiday_date).toLocaleDateString() : '-'}</td>
                  <td className="p-3">{h?.description || '-'}</td>
                  <td className="p-3 text-right">
                    <button className="btn btn-danger text-xs p-2" onClick={() => handleDeleteHoliday(h.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
              {(!holidays || holidays.length === 0) && (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-muted">Belum ada hari libur.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function OfficeApp() {
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('loggedInUser') || 'admin');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        setLoggedInUser(username);
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('loggedInUser', username);
        navigate('/office');
      } else {
        alert('Login gagal: Username atau Password salah');
      }
    } catch (err) {
      alert('Terjadi kesalahan pada server');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('loggedInUser');
    navigate('/office');
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-hover w-full p-6">
        <div className="w-full max-w-xs card shadow-2xl p-8 pt-10">
          <div className="flex justify-center w-full mb-6">
            <div style={{ width: '80px', height: '80px' }}>
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-primary">BackOffice Login</h2>
            <p className="text-sm text-muted mt-2">Masuk menggunakan akun admin</p>
          </div>
          <form onSubmit={handleLogin} className="text-center">
            <div className="form-group">
              <label className="form-label text-center">Username / NIP</label>
              <input type="text" className="form-control text-center" value={username} onChange={e => setUsername(e.target.value)} placeholder="Masukkan username..." required />
            </div>
            <div className="form-group">
              <label className="form-label text-center">Password</label>
              <input type="password" className="form-control text-center" value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password..." required />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-4">Masuk</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-view w-full">
      <Sidebar onLogout={handleLogout} onChangePassword={() => setShowChangePassword(true)} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/leaves" element={<LeaveApproval />} />
          <Route path="/reports" element={<AttendanceReport />} />
          <Route path="/settings" element={<SettingsComponent />} />
          <Route path="*" element={<div className="p-6">Fitur dalam pengembangan...</div>} />
        </Routes>
      </div>
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} username={loggedInUser} />}
    </div>
  );
}
