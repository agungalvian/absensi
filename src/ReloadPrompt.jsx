import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

function ReloadPrompt() {
  const registerSW = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  if (!registerSW) return null

  const {
    offlineReady: [offlineReady, setOfflineReady] = [false, () => {}],
    needUpdate: [needUpdate, setNeedUpdate] = [false, () => {}],
    updateServiceWorker,
  } = registerSW

  const close = () => {
    setOfflineReady(false)
    setNeedUpdate(false)
  }

  return (
    <div className="ReloadPrompt-container">
      {(offlineReady || needUpdate) && (
        <div className="ReloadPrompt-toast">
          <div className="ReloadPrompt-message">
            {offlineReady ? (
              <span>Aplikasi siap digunakan secara offline</span>
            ) : (
              <span>Versi terbaru tersedia, perbarui sekarang untuk fitur terbaru?</span>
            )}
          </div>
          <div className="ReloadPrompt-buttons">
            {needUpdate && (
              <button className="ReloadPrompt-toast-button" onClick={() => updateServiceWorker(true)}>
                Update & Refresh
              </button>
            )}
            <button className="ReloadPrompt-toast-button" onClick={() => close()}>
              Nanti Saja
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReloadPrompt
