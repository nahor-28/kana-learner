import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { db } from './data/db';
import { Onboarding } from './components/Onboarding';
import { Home } from './pages/Home';
import { Session } from './pages/Session';
import { Study } from './pages/Study';
import { Stats } from './pages/Stats';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    db.settings.get('singleton').then(s => {
      setNeedsOnboarding(!s?.userName);
    });
  }, []);

  if (needsOnboarding === null) {
    return (
      <div className="flex items-center justify-center min-h-dvh opacity-40">
        Loading…
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={() => setNeedsOnboarding(false)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session" element={<Session />} />
        <Route path="/study" element={<Study />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
