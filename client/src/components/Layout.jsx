import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const { isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav_dashboard'), end: true },
    { to: '/inbox', icon: InboxIcon, label: t('nav_inbox') },
    { to: '/team', icon: UserCog, label: t('nav_team') },
    { to: '/contacts', icon: Users, label: t('nav_contacts') },
    { to: '/lists', icon: List, label: t('nav_lists') },
    { to: '/campaigns/new', icon: MessageSquarePlus, label: t('nav_new_campaign') },
    { to: '/campaigns', icon: History, label: t('nav_history'), end: true },
    { to: '/templates', icon: LayoutTemplate, label: t('nav_templates') },
    { to: '/automations', icon: GitBranch, label: t('nav_automations') },
    { to: '/media', icon: Image, label: t('nav_media_library') },
    { to: '/settings', icon: Settings, label: t('nav_settings') },
  ];

  const mainNavItems = navItems.filter(item => !['/team', '/settings'].includes(item.to));
  const bottomNavItems = navItems.filter(item => ['/team', '/settings'].includes(item.to));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-[#F3F5FA] dark:bg-surface-dark border-r border-gray-200/50 dark:border-gray-800/80 flex-col hidden md:flex font-sans">
        <div className="p-4 flex flex-col h-full">

          {/* Header Pill */}
          <div className="mb-6 mx-2">
            <div className="bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-2xl flex items-center justify-center font-bold text-sm tracking-wide shadow-sm backdrop-blur-sm">
              {t('organization_header')}
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
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
                    }`
                  }
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <item.icon size={20} className={`flex-shrink-0 transition-colors ${({ isActive }) => isActive ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={1.8} />
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
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-emerald-50/50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200'
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-2xl transition-all duration-200 font-medium group"
            >
              <LogOut size={20} className="group-hover:text-red-500 transition-colors" strokeWidth={1.8} />
              <span>{t('nav_logout')}</span>
            </button>
          </div>

          <div className="px-6 py-2">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              {user ? t('logged_in_as', { name: user.username }) : ''}
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
            <div className="bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-xl font-bold text-sm tracking-wide">
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
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 shadow-sm'
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
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-emerald-50/50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200'
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            ))}

            <button
              onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 rounded-2xl transition-all duration-200 font-medium"
            >
              <LogOut size={20} strokeWidth={1.8} />
              <span>{t('nav_logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-background-dark relative z-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 px-4 py-3.5 flex items-center justify-between shadow-soft">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs">WS</span>
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