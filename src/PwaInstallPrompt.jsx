import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not installed, show a special instruction
    if (isIOS && !isStandalone) {
      // Small delay to ensure smooth UI
      setTimeout(() => setIsVisible(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      alert('Untuk menginstal di iPhone/iPad:\n1. Klik tombol "Share" (kotak dengan panah atas)\n2. Pilih "Add to Home Screen" atau "Tambah ke Layar Utama"');
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-sm">
      <div className="glass-panel p-4 flex items-center justify-between shadow-2xl border-primary/20 animate-slide-down">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1">
            <img src="/pwa-192x192.png" alt="App Icon" className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Instal Aplikasi</h4>
            <p className="text-[10px] text-muted">Akses lebih cepat & offline</p>
          </div>
        </div>
        <button 
          onClick={handleInstallClick}
          className="bg-primary text-white text-xs font-bold py-2 px-4 rounded-full flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/30"
        >
          <Download size={14} />
          Instal
        </button>
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-surface-hover rounded-full flex items-center justify-center text-muted hover:text-main border border-border shadow-md"
        >
          ×
        </button>
      </div>
    </div>
  );
}
