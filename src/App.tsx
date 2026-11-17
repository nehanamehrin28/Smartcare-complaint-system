import { useEffect, useState } from 'react';
import { AuthView } from './components/AuthView';
import { DashboardWorkspace } from './components/DashboardWorkspace';
import { HomePage } from './components/HomePage';
import { TrackComplaintView } from './components/TrackComplaintView';
import { fetchCurrentUser, logoutAccount } from './lib/api';
import type { User } from './types/smartcare';

type PageRoute = 'home' | 'auth' | 'dashboard' | 'submit' | 'track';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState<PageRoute>('home');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [postAuthTarget, setPostAuthTarget] = useState<'dashboard' | 'submit'>('dashboard');
  const [trackingCode, setTrackingCode] = useState('');

  useEffect(() => {
    fetchCurrentUser()
      .then((u) => {
        setUser(u);
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, []);

  const handleNavigate = (
    target: PageRoute,
    options?: { trackingCode?: string; authTab?: 'login' | 'register' }
  ) => {
    if (options?.trackingCode !== undefined) {
      setTrackingCode(options.trackingCode);
    }
    if (options?.authTab) {
      setAuthTab(options.authTab);
    }
    if ((target === 'dashboard' || target === 'submit') && !user) {
      setPostAuthTarget(target);
      setPage('auth');
      window.scrollTo({ top: 0 });
      return;
    }
    if (target === 'submit' && user?.role === 'admin') {
      setPage('dashboard');
      window.scrollTo({ top: 0 });
      return;
    }
    setPage(target);
    window.scrollTo({ top: 0 });
  };

  const handleAuthSuccess = (signedInUser: User) => {
    setUser(signedInUser);
    if (signedInUser.role === 'admin') {
      setPage('dashboard');
    } else {
      setPage(postAuthTarget);
    }
    setPostAuthTarget('dashboard');
    window.scrollTo({ top: 0 });
  };

  const handleLogout = async () => {
    await logoutAccount();
    setUser(null);
    setPage('home');
    window.scrollTo({ top: 0 });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-navy-900 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading SmartCare...</p>
        </div>
      </div>
    );
  }

  if (page === 'auth') {
    return (
      <AuthView
        initialTab={authTab}
        onSuccess={handleAuthSuccess}
        onBack={() => handleNavigate('home')}
      />
    );
  }

  if (page === 'track') {
    return (
      <TrackComplaintView
        user={user}
        initialTrackingCode={trackingCode}
        onBack={() => handleNavigate(user ? 'dashboard' : 'home')}
        onGoPortal={() => handleNavigate(user ? 'dashboard' : 'auth', { authTab: 'login' })}
      />
    );
  }

  if ((page === 'dashboard' || page === 'submit') && user) {
    return (
      <DashboardWorkspace
        user={user}
        initialView={page === 'submit' ? 'submit' : 'overview'}
        onLogout={handleLogout}
        onGoHome={() => handleNavigate('home')}
        onGoTrack={(code) => handleNavigate('track', { trackingCode: code || '' })}
      />
    );
  }

  return <HomePage user={user} onNavigate={handleNavigate} />;
}
