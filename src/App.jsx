import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MobileApp from './mobile/MobileApp';
import OfficeApp from './office/OfficeApp';
import ReloadPrompt from './ReloadPrompt';
import PwaInstallPrompt from './PwaInstallPrompt';

function App() {
  return (
    <BrowserRouter>
      <PwaInstallPrompt />
      <Routes>
        <Route path="/office/*" element={<OfficeApp />} />
        <Route path="/*" element={<MobileApp />} />
      </Routes>
      <ReloadPrompt />
    </BrowserRouter>
  );
}

export default App;
