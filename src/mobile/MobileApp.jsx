import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { MapPin, Clock, Calendar, User, LogOut, CheckCircle, AlertTriangle, List, Lock, RefreshCw, Download } from 'lucide-react';
import usePWAInstall from '../usePWAInstall';

function MobileLogin({ onLogin }) {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (nip && password) {
      try {
        const res = await fetch('/api/mobile/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nip, password })
        });
        const data = await res.json();
        if (data.success) {
          onLogin(data.user);
          localStorage.setItem('mobile_user', JSON.stringify(data.user));
        } else {
          alert('Login gagal: ' + data.message);
        }
      } catch (err) {
        alert('Terjadi kesalahan pada server');
      }
    } else {
      alert('Masukkan NIP dan Password');
    }
  };

  return (
    <div className="mobile-view flex flex-col justify-center items-center p-6 bg-surface-hover">
      <div className="w-full max-w-sm card shadow-2xl p-8 pt-10">
        <div className="flex justify-center w-full mb-4">
          <div style={{ width: '48px', height: '48px' }}>
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="font-bold text-2xl text-primary">Absensi Digital</h2>
          <p className="text-sm mt-2 text-muted">Masuk menggunakan NIP Anda</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group text-left">
            <label className="form-label">Nomor Induk Pegawai (NIP)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Masukkan NIP..."
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              required
            />
          </div>
          <div className="form-group text-left">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Masukkan Password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-4">Masuk</button>
        </form>
      </div>
    </div>
  );
}

function getDistance(lat1, lon1, lat2, lon2) {
  // Ensure we are working with numbers and replace commas with dots
  const nLat1 = typeof lat1 === 'string' ? Number(lat1.replace(',', '.')) : Number(lat1);
  const nLon1 = typeof lon1 === 'string' ? Number(lon1.replace(',', '.')) : Number(lon1);
  const nLat2 = typeof lat2 === 'string' ? Number(lat2.replace(',', '.')) : Number(lat2);
  const nLon2 = typeof lon2 === 'string' ? Number(lon2.replace(',', '.')) : Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return Infinity;

  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = nLat1 * Math.PI / 180;
  const φ2 = nLat2 * Math.PI / 180;
  const Δφ = (nLat2 - nLat1) * Math.PI / 180;
  const Δλ = (nLon2 - nLon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // dalam meter
}

function MobileHome({ user, onChangePassword, isInstallable, installApp }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState(null); // 'in', 'out'
  const [locationStatus, setLocationStatus] = useState('Mencari lokasi...');
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [distance, setDistance] = useState(null);
  const [settings, setSettings] = useState({ lat: -6.2088, lng: 106.8456, radius: 50 });
  const [userPos, setUserPos] = useState({ lat: 0, lng: 0, accuracy: 0 });
  const [targetOffice, setTargetOffice] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('Mencari alamat...');
  const [todayLogs, setTodayLogs] = useState([]);
  const [lastSync, setLastSync] = useState(new Date());
  const navigate = useNavigate();

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const appSettings = (data && typeof data === 'object' && Object.keys(data).length > 0) ? data : { lat: -6.2088, lng: 106.8456, radius: 50, offices: [] };
        setSettings(appSettings);
        setLastSync(new Date());
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchSettings();
    const syncInterval = setInterval(fetchSettings, 60000); // Sync settings every 1 minute
    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    const checkStatus = () => {
      fetch(`/api/attendance/me/${user.nip}`)
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data)) return;
          const today = new Date().toLocaleDateString('en-CA');
          const logs = data.filter(l => new Date(l.timestamp).toLocaleDateString('en-CA') === today);
          setTodayLogs(logs);

          const now = new Date();
          const currentHourMin = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
          const isAfterWork = settings.shiftEnd && currentHourMin >= settings.shiftEnd;

          if (isAfterWork) {
            setStatus(logs.some(l => l.type === 'out') ? 'done_out' : 'ready_out');
          } else {
            setStatus(logs.some(l => l.type === 'in') ? 'done_in' : 'ready_in');
          }
        }).catch(() => {});
    };

    if (settings.shiftEnd) checkStatus();
    const statusInterval = setInterval(checkStatus, 30000); // Check status every 30s
    return () => clearInterval(statusInterval);
  }, [settings.shiftEnd, user.nip]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    let watchId;

    function startTracking(appSettings) {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition((position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          setUserPos({ lat: userLat, lng: userLng, accuracy: accuracy });

          // Reverse Geocoding via Server Proxy (30s refresh)
          const now = Date.now();
          if (!window._lastGeoSearch || now - window._lastGeoSearch > 30000) {
            window._lastGeoSearch = now;
            fetch(`/api/geodecode?lat=${userLat}&lng=${userLng}`)
              .then(res => res.json())
              .then(data => {
                if (data && data.display_name) {
                  const addr = data.display_name.split(',').slice(0, 3).join(',');
                  setCurrentAddress(addr);
                } else {
                  setCurrentAddress('Alamat tidak ditemukan');
                }
              }).catch(() => {
                setCurrentAddress('Gagal memuat alamat');
                window._lastGeoSearch = now - 20000; // Retry sooner on failure
              });
          }

          let closestDist = Infinity;
          let closestOffice = null;

          const currentOffices = Array.isArray(appSettings.offices) && appSettings.offices.length > 0 
            ? appSettings.offices 
            : [{ name: 'Kantor Utama', lat: Number(appSettings.lat), lng: Number(appSettings.lng) }];

          currentOffices.forEach(office => {
            const dist = getDistance(userLat, userLng, Number(office.lat), Number(office.lng));
            if (dist < closestDist) {
              closestDist = dist;
              closestOffice = office;
            }
          });

          setDistance(Math.round(closestDist));
          setTargetOffice(closestOffice);

          const radius = Number(appSettings.radius) || 50;
          if (closestDist <= radius) {
            setIsWithinRadius(true);
            setLocationError(false);
            setLocationStatus(`Berada di ${closestOffice.name || 'Kantor'}`);
          } else {
            setIsWithinRadius(false);
            setLocationError(false);
            setLocationStatus(`Di Luar Radius ${closestOffice.name || 'Kantor'}`);
          }
        }, (error) => {
          let errorMsg = 'Gagal mendapatkan lokasi. Aktifkan GPS.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Akses Lokasi Ditolak. Harap izinkan GPS di browser Anda.';
            setLocationError(true);
          }
          setLocationStatus(errorMsg);
          setIsWithinRadius(false);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      } else {
        setLocationStatus('Geolocation tidak didukung browser ini.');
        setLocationError(true);
      }
    }

    if (settings.radius) startTracking(settings);

    return () => {
      clearInterval(timer);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [settings.radius, settings.offices]);

  const handleAttend = async () => {
    if (status === 'done_in' || status === 'done_out') return;
    const type = status === 'ready_in' ? 'in' : 'out';
    
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip: user.nip,
          type: type,
          location_lat: userPos.lat,
          location_lng: userPos.lng,
          office_name: targetOffice ? targetOffice.name : 'Unknown',
          distance_meters: distance
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(type === 'in' ? 'done_in' : 'done_out');
        fetch(`/api/attendance/me/${user.nip}`)
          .then(res => res.json())
          .then(data => {
            if (!Array.isArray(data)) return;
            const today = new Date().toLocaleDateString('en-CA');
            setTodayLogs(data.filter(l => new Date(l.timestamp).toLocaleDateString('en-CA') === today));
          });
        alert(`Berhasil presensi ${type === 'in' ? 'Masuk' : 'Pulang'} pada ${currentTime.toLocaleTimeString()}`);
      }
    } catch (err) {
      alert('Gagal mengirim data absensi');
    }
  };

  return (
    <div className="p-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-bold text-xl">Halo, {user.name}</h2>
          <p className="text-xs opacity-70">Terakhir update: {lastSync.toLocaleTimeString('id-ID')}</p>
        </div>
        <div className="flex gap-2">
          {isInstallable && (
            <div 
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer border border-primary/20 animate-bounce"
              onClick={installApp}
              title="Instal Aplikasi"
            >
              <Download size={18} className="text-primary" />
            </div>
          )}
          <div 
            className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center cursor-pointer border border-border/30"
            onClick={fetchSettings}
            title="Refresh Data"
          >
            <RefreshCw size={18} className="text-primary" />
          </div>
          <div 
            className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center cursor-pointer border border-border/30"
            onClick={onChangePassword}
          >
            <User size={20} className="text-primary" />
          </div>
        </div>
      </div>

      <div className="glass-panel text-center mb-6">
        <p className="text-sm mb-2">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-4xl font-bold text-primary mb-4">{currentTime.toLocaleTimeString('id-ID')}</h1>

        <div className={`flex flex-col items-center justify-center gap-1 text-sm mb-6 ${isWithinRadius ? 'text-primary' : 'text-warning'}`}>
          <div className="flex items-center gap-2">
            {isWithinRadius ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span className="font-bold">{locationStatus}</span>
          </div>
          
          <div className="mt-2 bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-border/50 w-full max-w-[320px]">
            <div className="flex items-start gap-2 text-left">
              <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Lokasi Saat Ini</p>
                <p className="text-[12px] font-bold leading-tight">
                  {currentAddress}
                </p>
              </div>
            </div>
          </div>
        </div>

        {locationError && (
          <div className="bg-danger text-white p-3 rounded-lg text-sm mb-6 text-center animate-pulse">
            <AlertTriangle size={20} className="mx-auto mb-1" />
            Izinkan akses Lokasi (GPS) agar Anda bisa melakukan absensi.
          </div>
        )}

        <div className="flex justify-center w-full">
          <button
            className={`circle-btn ${!isWithinRadius || status === 'done_in' || status === 'done_out' ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            onClick={handleAttend}
            disabled={status === 'done_in' || status === 'done_out' || !isWithinRadius}
          >
            <Clock size={32} />
            <span>
              {status === 'done_in' ? 'Sudah Masuk' :
                status === 'done_out' ? 'Sudah Pulang' :
                  status === 'ready_out' ? 'Absen Pulang' : 'Absen Masuk'}
            </span>
          </button>
        </div>

        {todayLogs.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border/50 text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Riwayat Hari Ini</h3>
            <div className="flex flex-col gap-3">
              {todayLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map(log => (
                <div key={log.id} className="flex items-center justify-between bg-surface-hover/50 p-3 rounded-lg border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${log.type === 'in' ? 'bg-success' : 'bg-danger'}`}></div>
                    <div>
                      <p className="text-sm font-bold">{log.type === 'in' ? 'Masuk' : 'Pulang'}</p>
                      <p className="text-[10px] text-muted">{log.office_name}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary">{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4 flex flex-col items-center text-center cursor-pointer" onClick={() => navigate('/leaves')}>
          <Calendar size={24} className="mb-2 text-primary" />
          <h3 className="font-semibold mb-1">Cuti & Izin</h3>
          <p className="text-xs">Sisa cuti: {(user.leave_quota || 0) + (user.leave_carry_over || 0)} hari</p>
        </div>
        <div className="glass-panel p-4 flex flex-col items-center text-center">
          <AlertTriangle size={24} className="mb-2 text-warning" />
          <h3 className="font-semibold mb-1">Lembur</h3>
          <p className="text-xs">0 Jam bulan ini</p>
        </div>
      </div>
    </div>
  );
}

function LeavesComponent({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ leave_type: 'Cuti Tahunan', start_date: '', end_date: '', reason: '', delegate_nip: '' });

  const fetchLeaves = () => {
    fetch(`/api/leaves/me/${user.nip}`)
      .then(res => res.json())
      .then(data => setLeaves(data));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const updateOffice = (id, field, value) => {
    // If field is lat or lng, convert comma to dot for numerical safety
    const processedValue = (field === 'lat' || field === 'lng') ? value.replace(',', '.') : value;
    setSettings(prev => ({
      ...prev,
      offices: prev.offices.map(o => o.id === id ? { ...o, [field]: processedValue } : o)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, nip: user.nip })
      });
      const data = await res.json();
      if (data.success) {
        alert('Pengajuan berhasil dikirim');
        setShowForm(false);
        fetchLeaves();
      } else {
        alert(data.message || 'Gagal mengirim pengajuan');
      }
    } catch (err) {
      alert('Terjadi kesalahan server');
    }
  };

  return (
    <div className="p-6 pb-24">
      <h2 className="text-2xl font-bold mb-6">Cuti & Izin</h2>

      <div className="flex flex-col gap-4 mb-8">
        <div className="card p-6 text-center flex flex-col items-center justify-center">
          <p className="text-sm text-muted mb-1">Sisa Cuti</p>
          <h3 className="text-4xl font-bold text-primary">{(user.leave_quota || 0)}</h3>
          <p className="text-xs text-muted mt-1">Carry over: {user.leave_carry_over || 0}</p>
        </div>
        <button className="btn btn-primary w-full py-4 flex flex-col justify-center items-center border-none shadow-lg" style={{ height: 'auto' }} onClick={() => setShowForm(true)}>
          <span className="text-2xl mb-1">+</span>
          <span className="font-bold">Ajukan Baru</span>
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-primary shadow-lg">
          <h3 className="font-bold mb-4">Form Pengajuan</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Jenis</label>
              <select className="form-control" value={formData.leave_type} onChange={e => setFormData({ ...formData, leave_type: e.target.value })}>
                <option>Cuti Tahunan</option>
                <option>Izin Sakit</option>
                <option>Izin Khusus</option>
                <option>Izin Alasan Penting</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group mb-0">
                <label className="form-label">Mulai</label>
                <input type="date" className="form-control" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Selesai</label>
                <input type="date" className="form-control" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} required />
              </div>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Alasan</label>
              <input type="text" className="form-control" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} required />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">NIP Pjs (Delegasi)</label>
              <input type="text" className="form-control" value={formData.delegate_nip} onChange={e => setFormData({ ...formData, delegate_nip: e.target.value })} placeholder="Opsional (Jika ada yang menggantikan)" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Kirim</button>
            </div>
          </form>
        </div>
      )}

      <h3 className="font-bold mb-4">Riwayat Pengajuan</h3>
      <div className="flex flex-col gap-4">
        {(leaves || []).map(l => (
          <div key={l?.id || Math.random()} className="card p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">{l?.leave_type || '-'}</h4>
                <p className="text-xs text-muted">{l?.start_date ? new Date(l.start_date).toLocaleDateString() : '-'} - {l?.end_date ? new Date(l.end_date).toLocaleDateString() : '-'}</p>
              </div>
              <span className={`status-badge ${l?.status === 'Approved' ? 'status-success' : l?.status === 'Rejected' ? 'status-danger' : 'status-warning'}`}>
                {l?.status || 'Pending'}
              </span>
            </div>
            <p className="text-sm mt-2">{l?.reason || '-'}</p>
            {l?.delegate_nip && <p className="text-xs text-primary mt-2">Pjs: {l.delegate_nip}</p>}
          </div>
        ))}
        {(!leaves || leaves.length === 0) && <p className="text-center text-muted">Belum ada riwayat pengajuan</p>}
      </div>
    </div>
  );
}

function HistoryComponent({ user }) {
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString('en-CA');
  });

  const fetchHistory = () => {
    fetch(`/api/attendance/me/${user.nip}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
        else setLogs([]);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp).toLocaleDateString('en-CA');
    return logDate >= startDate && logDate <= endDate;
  });

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = [2024, 2025, 2026];

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const dateStr = new Date(log.timestamp).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(log);
    return acc;
  }, {});

  return (
    <div className="p-6 pb-24">
      <h2 className="text-2xl font-bold mb-6">Riwayat Absensi</h2>

      <div className="card mb-6 border-primary/20">
        <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          Filter Rentang Tanggal
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group mb-0">
            <label className="form-label text-[10px] uppercase tracking-wider">Mulai</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-[10px] uppercase tracking-wider">Sampai</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {Object.entries(groupedLogs).map(([date, dayLogs]) => (
          <div key={date} className="day-group">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-[1px] flex-1 bg-border"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted whitespace-nowrap">{date}</span>
              <div className="h-[1px] flex-1 bg-border"></div>
            </div>
            <div className="flex flex-col gap-3">
              {dayLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map(log => (
                <div key={log.id} className="card p-4 border-l-4 border-l-primary hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-base leading-tight">{log.type === 'in' ? 'Absen Masuk' : 'Absen Pulang'}</p>
                      <p className="text-xs text-primary font-bold mt-1 bg-primary/5 inline-block px-2 py-0.5 rounded">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="status-badge status-success text-[9px] py-1 px-2 flex items-center gap-1">
                        <CheckCircle size={10} /> Terverifikasi
                      </span>
                      <p className="text-[9px] text-muted max-w-[100px] truncate">{log.office_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-center py-20 text-muted glass-panel border-dashed">
            <List size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Tidak ada data absensi ditemukan</p>
            <p className="text-[10px] mt-1">Coba ubah rentang tanggal filter</p>
          </div>
        )}
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
    <div className="modal-overlay" style={{ padding: '1rem' }}>
      <div className="modal-content w-full max-w-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Lock className="text-primary" />
          Ganti Password
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group mb-0">
            <label className="form-label text-xs uppercase">Password Lama</label>
            <input type="password" name="old" className="form-control" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs uppercase">Password Baru</label>
            <input type="password" name="new" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs uppercase">Konfirmasi Baru</label>
            <input type="password" name="confirm" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <button type="submit" className="btn btn-primary w-full">Ganti Password</button>
            <button type="button" className="btn btn-secondary w-full" onClick={onClose}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MobileApp() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mobile_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { isInstallable, installApp } = usePWAInstall();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user && location.pathname !== '/') {
      navigate('/');
    }
    
    // Handle Hardware Back Button
    const handleBack = (e) => {
      // If we are on home page, we want to let the app close (OS handles this)
      // If we are on leaves or history, go back to home
      if (location.pathname === '/home') {
        // No-op, let default back behavior happen (exit PWA)
        return;
      } else if (location.pathname !== '/') {
        // Prevent default and go home
        e.preventDefault();
        navigate('/home');
      }
    };

    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [user, location, navigate]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mobile_user');
    navigate('/', { replace: true });
  };

  if (!user) {
    return <MobileLogin onLogin={(u) => { setUser(u); navigate('/home'); }} />;
  }

  return (
    <div className="mobile-view">
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<MobileHome user={user} onChangePassword={() => setShowChangePassword(true)} isInstallable={isInstallable} installApp={installApp} />} />
          <Route path="/leaves" element={<LeavesComponent user={user} />} />
          <Route path="/history" element={<HistoryComponent user={user} />} />
        </Routes>
      </div>
      <div className="bottom-nav">
        <div className={`nav-item ${location.pathname === '/home' ? 'active' : ''}`} onClick={() => navigate('/home', { replace: true })}>
          <Clock size={24} />
          <span>Absen</span>
        </div>
        <div className={`nav-item ${location.pathname === '/leaves' ? 'active' : ''}`} onClick={() => navigate('/leaves')}>
          <Calendar size={24} />
          <span>Cuti/Izin</span>
        </div>
        <div className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`} onClick={() => navigate('/history')}>
          <List size={24} />
          <span>Riwayat</span>
        </div>
        <div className={`nav-item`} onClick={handleLogout}>
          <LogOut size={24} />
          <span>Keluar</span>
        </div>
      </div>
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} username={user.nip} />}
    </div>
  );
}
