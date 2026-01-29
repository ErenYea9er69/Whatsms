import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  List,
  MessageSquarePlus,
  LayoutTemplate,
  History,
  Settings,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
  Image,
  GitBranch,
  Inbox as InboxIcon,
  UserCog
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
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/inbox', icon: InboxIcon, label: 'Inbox' },
    { to: '/team', icon: UserCog, label: 'Team' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/lists', icon: List, label: 'Lists' },
    { to: '/campaigns/new', icon: MessageSquarePlus, label: 'New Campaign' },
    { to: '/campaigns', icon: History, label: 'History', end: true },
    { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
    { to: '/automations', icon: GitBranch, label: 'Automations' },
    { to: '/media', icon: Image, label: 'Media Library' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const mainNavItems = navItems.filter(item => !['Team', 'Settings'].includes(item.label));
  const bottomNavItems = navItems.filter(item => ['Team', 'Settings'].includes(item.label));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-[#F3F5FA] dark:bg-surface-dark border-r border-gray-200/50 dark:border-gray-800/80 flex-col hidden md:flex font-sans">
        <div className="p-4 flex flex-col h-full">

          {/* Header Pill */}
          <div className="mb-6 mx-2">
            <div className="bg-indigo-100/50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-4 py-3 rounded-2xl flex items-center justify-center font-bold text-sm tracking-wide shadow-sm backdrop-blur-sm">
              WHATSMS ORGANIZATION
            </div>
          </div>

          {/* Main White Card Navigation */}
          <div className="bg-white dark:bg-gray-800/50 rounded-[2rem] p-4 shadow-sm flex-1 overflow-y-auto mb-4">
            <div className="mb-4 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>
            <nav className="space-y-1">
              {mainNavItems.map((item, index) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium group ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
                    }`
                  }
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <item.icon size={20} className={`flex-shrink-0 transition-colors ${({ isActive }) => isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bottom Actions Section */}
          <div className="px-2 space-y-1 mb-2">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium group ${isActive
                    ? 'text-indigo-600 dark:text-indigo-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-indigo-50/50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200'
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            ))}

            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-indigo-50/50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200 rounded-2xl transition-all duration-200 font-medium group"
            >
              {isDark ? (
                <Sun size={20} className="group-hover:text-amber-500 transition-colors" strokeWidth={1.8} />
              ) : (
                <Moon size={20} className="group-hover:text-indigo-500 transition-colors" strokeWidth={1.8} />
              )}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-2xl transition-all duration-200 font-medium group"
            >
              <LogOut size={20} className="group-hover:text-red-500 transition-colors" strokeWidth={1.8} />
              <span>Logout</span>
            </button>
          </div>

          <div className="px-6 py-2">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              {user ? `Logged in as ${user.username}` : ''}
            </p>
          </div>

        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-80 bg-[#F3F5FA] dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 mx-2">
            <div className="bg-indigo-100/50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl font-bold text-sm tracking-wide">
              WHATSMS
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-[2rem] p-4 shadow-sm flex-1 overflow-y-auto mb-4">
            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
                    }`
                  }
                >
                  <item.icon size={20} className="flex-shrink-0" strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="px-2 space-y-1 mb-2">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium group ${isActive
                    ? 'text-indigo-600 dark:text-indigo-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-indigo-50/50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200'
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-indigo-50/50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200 rounded-2xl transition-all duration-200 font-medium"
            >
              {isDark ? <Sun size={20} strokeWidth={1.8} /> : <Moon size={20} strokeWidth={1.8} />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 rounded-2xl transition-all duration-200 font-medium"
            >
              <LogOut size={20} strokeWidth={1.8} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-background-dark m-0 md:m-4 md:ml-0 md:rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 relative z-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 px-4 py-3.5 flex items-center justify-between shadow-soft">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">WS</span>
            <span className="text-gray-800 dark:text-white">WhatsSMS</span>
          </h1>
          <div className="flex gap-1">
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