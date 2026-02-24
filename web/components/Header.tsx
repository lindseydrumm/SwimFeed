//
//  Header.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//


import React from 'react';
import { NavLink } from 'react-router-dom';
import { Waves, Activity, Medal, Newspaper, Compass, BookOpen, BookMarked, Bookmark, BarChart3, Settings } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

const navItems = [
  { name: 'My Feed', icon: Newspaper, path: '/', end: true },
  { name: 'Athletes', icon: Activity, path: '/athletes' },
  { name: 'Events', icon: Medal, path: '/events', end: true },
  { name: 'Explore', icon: Compass, path: '/explore', end: true },
  { name: 'Storylines', icon: BookOpen, path: '/storylines', end: true },
  { name: 'Learn', icon: BookMarked, path: '/learn', end: true },
  { name: 'Saved', icon: Bookmark, path: '/saved', end: true },
  { name: 'Recap', icon: BarChart3, path: '/recap', end: true },
  { name: 'Settings', icon: Settings, path: '/settings', end: true },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Waves className="h-6 w-6 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Swim<span className="text-cyan-400">Stats</span>
          </span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-800 cursor-pointer hover:ring-cyan-400 transition-all">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}