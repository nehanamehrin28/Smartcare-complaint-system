import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { loginAccount, registerStudentAccount } from '../lib/api';
import type { User } from '../types/smartcare';
import { ErrorBanner, SmartCareLogo } from './StatusIndicator';

interface AuthViewProps {
  initialTab?: 'login' | 'register';
  onSuccess: (user: User) => void;
  onBack: () => void;
}

export function AuthView({ initialTab = 'login', onSuccess, onBack }: AuthViewProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (tab === 'login') {
        const res = await loginAccount({ email, password });
        onSuccess(res.user);
      } else {
        const res = await registerStudentAccount({
          name,
          email,
          password,
          studentId: studentId || undefined,
          department: department || undefined,
        });
        onSuccess(res.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string, demoPassword: string) => {
    setError(null);
    setTab('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setSubmitting(true);
    try {
      const res = await loginAccount({ email: demoEmail, password: demoPassword });
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Home</span>
          </button>

          <SmartCareLogo />

          <div className="w-24" aria-hidden="true" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          {/* Left Institutional Info Panel */}
          <div className="lg:col-span-5 bg-navy-900 text-white p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-sky-200 mb-3">
                SmartCare Campus Portal
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white leading-snug">
                {tab === 'login'
                  ? 'Sign in to your campus account'
                  : 'Create your student account'}
              </h1>
              <p className="mt-3 text-sm text-sky-100/85 leading-relaxed">
                Students can submit facility or service complaints, monitor resolution stages,
                and review official updates. Administrators manage priorities and dispatch campus
                units.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-navy-800 space-y-3">
              <p className="text-xs font-semibold text-sky-200">
                Quick Demo Access
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoSignIn('maya.lin@campus.edu', 'Student123!')}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <span className="block text-xs font-semibold text-white">
                    Demo Student · Maya Lin
                  </span>
                  <span className="block text-xs font-mono text-sky-200 mt-0.5">
                    maya.lin@campus.edu
                  </span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoSignIn('admin@smartcare.edu', 'Admin123!')}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-200" aria-hidden="true" />
                    <span>Demo Administrator · Dr. Elena Vance</span>
                  </span>
                  <span className="block text-xs font-mono text-sky-200 mt-0.5">
                    admin@smartcare.edu
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10">
            <div className="inline-flex p-1 bg-slate-100 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  tab === 'login'
                    ? 'bg-white text-navy-900 shadow-xs'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  tab === 'register'
                    ? 'bg-white text-navy-900 shadow-xs'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Student Registration
              </button>
            </div>

            {error && (
              <div className="mb-5">
                <ErrorBanner message={error} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-sm font-medium text-navy-900 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon
                        className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                      <input
                        id="auth-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="auth-student-id"
                        className="block text-sm font-medium text-navy-900 mb-1.5"
                      >
                        Student ID <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="auth-student-id"
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. STU-2026-0891"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="auth-department"
                        className="block text-sm font-medium text-navy-900 mb-1.5"
                      >
                        Department <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="auth-department"
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Mechanical Engineering"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-sm font-medium text-navy-900 mb-1.5"
                >
                  College Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@campus.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-sm font-medium text-navy-900 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tab === 'register' ? 'Minimum 6 characters' : 'Enter password'}
                    className="w-full pl-10 pr-11 py-2.5 rounded-lg border border-slate-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-lg bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Please wait...'
                  : tab === 'login'
                  ? 'Sign In to SmartCare'
                  : 'Register Student Account'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
