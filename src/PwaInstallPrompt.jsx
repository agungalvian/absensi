import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    } else {
      console.log('User dismissed the PWA install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
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
