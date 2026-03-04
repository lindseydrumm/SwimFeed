//
//  Header.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//

import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Waves, Activity, Medal, Newspaper, Compass, BookOpen, BookMarked, Bookmark, BarChart3, Settings } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

const headerItems = [
  { name: 'My Feed', icon: Newspaper, path: '/', end: true },
  { name: 'Athletes', icon: Activity, path: '/athletes' },
  { name: 'Events', icon: Medal, path: '/events', end: true },
  { name: 'Explore', icon: Compass, path: '/explore', end: true },
];

const sidebarItems = [
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
    
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);
    
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
        {/* Logo with dropdown */}
          <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2"
          >
            <div className="p-2 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20">
              <Waves className="h-6 w-6 text-cyan-400" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Swim<span className="text-cyan-400">Live</span>
            </span>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
          <div className="absolute right-0 top-full mt-2 py-2 min-w-[140px] rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-50">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={() => setMenuOpen(false)}
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
          
        <nav className="hidden md:flex items-center gap-1">
          {headerItems.map((item) => (
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
