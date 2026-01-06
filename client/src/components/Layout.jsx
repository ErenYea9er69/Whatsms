import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquarePlus,
  History,
  Settings,
  LogOut,
  Menu,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/campaigns/new', icon: MessageSquarePlus, label: 'New Campaign' },
    { to: '/campaigns', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white dark:bg-surface-dark border-r border-gray-200/80 dark:border-gray-800/80 flex-col hidden md:flex shadow-soft">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800/80">
          <h1 className="text-2xl font-bold gradient-text">WhatsSMS</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {user ? `Welcome, ${user.username}` : 'Marketing Platform'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group ${isActive
                  ? 'active bg-blue-50 dark:bg-blue-900/20 text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <item.icon size={20} className="icon-gray flex-shrink-0" strokeWidth={1.75} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800/80 space-y-1.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 font-medium group"
          >
            {isDark ? (
              <Sun size={20} className="icon-gray group-hover:text-amber-500 transition-colors" strokeWidth={1.75} />
            ) : (
              <Moon size={20} className="icon-gray group-hover:text-indigo-500 transition-colors" strokeWidth={1.75} />
            )}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-200 font-medium group"
          >
            <LogOut size={20} className="icon-gray group-hover:text-red-500 transition-colors" strokeWidth={1.75} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">WhatsSMS</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {user ? `Welcome, ${user.username}` : 'Marketing Platform'}
            </p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `nav-link flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive
                  ? 'active bg-blue-50 dark:bg-blue-900/20 text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              <item.icon size={20} className="icon-gray flex-shrink-0" strokeWidth={1.75} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 font-medium"
          >
            {isDark ? <Sun size={20} className="icon-gray" strokeWidth={1.75} /> : <Moon size={20} className="icon-gray" strokeWidth={1.75} />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 rounded-xl transition-all duration-200 font-medium"
          >
            <LogOut size={20} className="icon-gray" strokeWidth={1.75} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 px-4 py-3.5 flex items-center justify-between shadow-soft">
          <h1 className="text-xl font-bold gradient-text">WhatsSMS</h1>
          <div className="flex gap-1">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            >
              {isDark ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
            </button>
            <button
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;