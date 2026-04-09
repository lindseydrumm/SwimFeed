//
//  Header.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//

import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Waves, Activity, Medal, Newspaper, Compass, BookOpen, BookMarked, Bookmark, BarChart3, Settings, Trophy, LogOut, User } from 'lucide-react';
import { useAuth, useClerk, SignInButton } from '@clerk/clerk-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useUser } from '../src/store/UserStore';

const headerItems = [
  { name: 'My Feed', icon: Newspaper, path: '/', end: true },
  { name: 'Athletes', icon: Activity, path: '/athletes', end: true },
  { name: 'Events', icon: Medal, path: '/events', end: true },
  { name: 'Explore', icon: Compass, path: '/explore', end: true },
];

const sidebarItems = [
  { name: 'My Feed', icon: Newspaper, path: '/', end: true },
  { name: 'Athletes', icon: Activity, path: '/athletes', end: true },
  { name: 'Events', icon: Medal, path: '/events', end: true },
  { name: 'Explore', icon: Compass, path: '/explore', end: true },
  { name: 'Storylines', icon: BookOpen, path: '/storylines', end: true },
  { name: 'Records', icon: Trophy, path: '/records', end: true },
  { name: 'Learn', icon: BookMarked, path: '/learn', end: true },
  { name: 'Saved', icon: Bookmark, path: '/saved', end: true },
  { name: 'Recap', icon: BarChart3, path: '/recap', end: true },
];


export function Header() {
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const logoMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();
  const { state } = useUser();

  const displayName = state?.profile?.displayName ?? 'User';
  const userInitial = displayName
    .trim()
    .split(' ')
    .filter((n: string) => n.length > 0)
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target as Node)) {
        setLogoMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo + sidebar dropdown */}
        <div className="relative" ref={logoMenuRef}>
          <button
            onClick={() => setLogoMenuOpen(!logoMenuOpen)}
            className="flex items-center gap-2"
          >
            <div className="p-2 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20">
              <Waves className="h-6 w-6 text-cyan-400" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Swim<span className="text-cyan-400">Live</span>
            </span>
          </button>

          {logoMenuOpen && (
            <div className="absolute right-0 top-full mt-2 py-2 min-w-[140px] rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-50">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.end}
                  onClick={() => setLogoMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Centre nav */}
        <nav className="hidden md:flex items-center gap-1">
          {headerItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Right side: auth state */}
        <div className="flex items-center gap-2">
          {!isLoaded ? (
            <div className="h-8 w-8 rounded-full bg-slate-700 animate-pulse" />
          ) : isSignedIn ? (
            /* Signed-in: avatar + dropdown */
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-800 cursor-pointer hover:ring-cyan-400 transition-all">
                  {userInitial}
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
                  <NavLink
                    to="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-slate-300 text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </NavLink>
                  <ThemeSwitcher />
                  <button
                    onClick={() => signOut({ redirectUrl: '/' })}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-slate-300 text-sm w-full text-left border-t border-slate-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Guest: sign-in button */
            <SignInButton mode="modal">
              <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 text-sm font-medium transition-colors">
                <User className="h-4 w-4" />
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
