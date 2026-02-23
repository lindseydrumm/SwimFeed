import { Header } from '../components/Header';
import { WelcomeBanner } from '../components/WelcomeBanner';
import { YourAthletes } from '../components/YourAthletes';
import { UpcomingRaces } from '../components/UpcomingRaces';
import { NewsFeed } from '../components/NewsFeed';
import { RecentResults } from '../components/RecentResults';
import './App.css'
import OnboardingPage, { hasCompletedOnboarding } from './pages/OnboardingPage';
import { useState, useEffect } from 'react';

function App() {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const done = hasCompletedOnboarding();
    setCompleted(done);
  }, []);

  if (completed === null) {
    return null; 
  }

  
  if (!completed) {
    return <OnboardingPage />;
  }

  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 pb-20 font-sans">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8 max-w-6xl">
        <section>
          <WelcomeBanner />
        </section>

        <section>
          <YourAthletes />
        </section>

        <section>
          <UpcomingRaces />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <NewsFeed />
          </section>
          <section className="lg:col-span-1">
            <RecentResults />
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-800 mt-12 py-8 text-center text-slate-500 text-sm">
        <p>© 2024 SwimStats. Your personal swimming companion.</p>
      </footer>
    </div>
  );
}

export default App
