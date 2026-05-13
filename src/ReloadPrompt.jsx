import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, CheckCircle } from 'lucide-react'

function ReloadPrompt() {
  const registerSW = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const {
    offlineReady: [offlineReady, setOfflineReady] = [false, () => {}],
    needUpdate: [needUpdate, setNeedUpdate] = [false, () => {}],
    updateServiceWorker,
  } = registerSW || {};

  const close = () => {
    if (setOfflineReady) setOfflineReady(false);
    if (setNeedUpdate) setNeedUpdate(false);
  };

  if (!offlineReady && !needUpdate) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[3000] w-[90%] max-w-sm">
      <div className="glass-panel p-5 shadow-2xl border-primary/20 animate-slide-down flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {needUpdate ? <RefreshCw className="animate-spin-slow" size={24} /> : <CheckCircle size={24} />}
          </div>
          <div>
            <h4 className="font-bold text-base text-main">
              {needUpdate ? 'Update Tersedia!' : 'Aplikasi Siap!'}
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              {needUpdate 
                ? 'Versi terbaru sistem absensi sudah tersedia dengan peningkatan performa.' 
                : 'Aplikasi sekarang dapat diakses tanpa koneksi internet (Offline).'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {needUpdate && (
            <button 
              onClick={() => updateServiceWorker(true)}
              className="flex-1 bg-primary text-white text-sm font-bold py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Update Sekarang
            </button>
          )}
          <button 
            onClick={close}
            className="flex-1 bg-surface-hover text-main text-sm font-bold py-3 rounded-xl hover:bg-border/30 transition-all border border-border/50"
          >
            {needUpdate ? 'Nanti Saja' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReloadPrompt
