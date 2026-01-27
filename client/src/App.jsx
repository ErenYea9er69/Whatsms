import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Lists from './pages/Lists';
import Login from './pages/Login';
import CampaignBuilder from './pages/CampaignBuilder';
import CampaignHistory from './pages/CampaignHistory';
import MediaLibrary from './pages/MediaLibrary';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import FlowList from './pages/Automations/FlowList';
import FlowBuilder from './pages/Automations/FlowBuilder';
import Inbox from './pages/Inbox';
import Conversation from './pages/Conversation';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="lists" element={<Lists />} />
              <Route path="campaigns" element={<CampaignHistory />} />
              <Route path="campaigns/new" element={<CampaignBuilder />} />
              <Route path="templates" element={<Templates />} />
              <Route path="media" element={<MediaLibrary />} />
              <Route path="settings" element={<Settings />} />
              <Route path="automations" element={<FlowList />} />
              <Route path="automations/:id" element={<FlowBuilder />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="inbox/:id" element={<Conversation />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

