import { Header } from '../components/Header';
import { WelcomeBanner } from '../components/WelcomeBanner';
import { YourAthletes } from '../components/YourAthletes';
import { UpcomingRaces } from '../components/UpcomingRaces';
import { NewsFeed } from '../components/NewsFeed';
import { RecentResults } from '../components/RecentResults';
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 pb-20 font-sans">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8 max-w-6xl">
        {/* Welcome Section */}
        <section>
          <WelcomeBanner />
        </section>

        {/* Athletes Horizontal Scroll */}
        <section>
          <YourAthletes />
        </section>

        {/* Upcoming Races */}
        <section>
          <UpcomingRaces />
        </section>

        {/* Main Content Grid: News & Results */}
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
