import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { SplashScreen } from './components/SplashScreen';
import { UserStoreProvider } from './store/UserStore';
import { ThemeProvider } from './context/ThemeContext';
import { OnboardingGuard } from './components/OnboardingGuard';
import { HomePage } from './routes/HomePage';
import { OnboardingPage } from './routes/OnboardingPage';
import { StorylinesPage } from './routes/StorylinesPage';
import { StorylineDetailPage } from './routes/StorylineDetailPage';
import { SavedPage } from './routes/SavedPage';
import { LearnPage } from './routes/LearnPage';
import { RecapPage } from './routes/RecapPage';
import { SettingsPage } from './routes/SettingsPage';
import { EventPage } from '../components/EventPage';
import { EventDetailPage } from '../components/EventDetailPage';
import { SwimmerPage } from '../components/SwimmerPage';
import { AthletesPage } from '../components/AthletesPage';
import { RecordsPage } from './routes/RecordsPage';
import { FeedbackWidget } from '../components/FeedbackWidget';

function Layout() {
  const location = useLocation();
  const noHeaderFooterPaths = ['/login', '/onboarding'];
  
  const hideHeaderFooter = noHeaderFooterPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 pb-20 font-sans">
      {!hideHeaderFooter && <Header />}
      
      <main className="container mx-auto px-4 py-6 space-y-8 max-w-6xl">
        <Outlet />
      </main>

      {!hideHeaderFooter && (
        <footer className="border-t border-slate-800 mt-12 py-8 text-center text-slate-500 text-sm">
          <p>© 2026 SwimFeed. Your personal swimming companion.</p>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem('swimlive_splash_seen'),
  );

  return (
    <ThemeProvider>
      <UserStoreProvider>
        {showSplash && (
          <SplashScreen
            onComplete={() => {
              sessionStorage.setItem('swimlive_splash_seen', '1');
              setShowSplash(false);
            }}
          />
        )}

        <Routes>
          <Route element={<Layout />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route
              path="/"
              element={
                <OnboardingGuard>
                  <HomePage />
                </OnboardingGuard>
              }
            />
            <Route path="/events" element={<EventPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/athletes" element={<AthletesPage />} />
            <Route path="/athletes/:slug" element={<SwimmerPage />} />

            {/* Explore was removed; redirect legacy URLs to home. */}
            <Route path="/explore" element={<Navigate to="/" replace />} />
            <Route path="/explore/:laneId" element={<Navigate to="/" replace />} />

            <Route path="/storylines" element={<StorylinesPage />} />
            <Route path="/storylines/:id" element={<StorylineDetailPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route
              path="/saved"
              element={
                <OnboardingGuard>
                  <SavedPage />
                </OnboardingGuard>
              }
            />
            <Route
              path="/learn"
              element={
                <OnboardingGuard>
                  <LearnPage />
                </OnboardingGuard>
              }
            />
            <Route
              path="/recap"
              element={
                <OnboardingGuard>
                  <RecapPage />
                </OnboardingGuard>
              }
            />
            <Route
              path="/settings"
              element={
                <OnboardingGuard>
                  <SettingsPage />
                </OnboardingGuard>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>

        <FeedbackWidget />
      </UserStoreProvider>
    </ThemeProvider>
  );
}