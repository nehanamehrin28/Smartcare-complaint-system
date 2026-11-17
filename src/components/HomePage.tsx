import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Clock,
  FileText,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { fetchCampusOverview, type CampusOverviewStats } from '../lib/api';
import type { User } from '../types/smartcare';
import { SmartCareLogo } from './StatusIndicator';

interface HomePageProps {
  user: User | null;
  onNavigate: (
    page: 'home' | 'auth' | 'dashboard' | 'submit' | 'track',
    options?: { trackingCode?: string; authTab?: 'login' | 'register' }
  ) => void;
}

export function HomePage({ user, onNavigate }: HomePageProps) {
  const [stats, setStats] = useState<CampusOverviewStats | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [centerImgFailed, setCenterImgFailed] = useState(false);
  const [deskImgFailed, setDeskImgFailed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchCampusOverview()
      .then(setStats)
      .catch(() => {
        // Keep graceful static institutional defaults if offline
      });
  }, []);

  const handlePrimaryPortalClick = () => {
    if (user) {
      onNavigate('dashboard');
    } else {
      onNavigate('auth', { authTab: 'login' });
    }
  };

  const handleSubmitComplaintClick = () => {
    if (user) {
      onNavigate('submit');
    } else {
      onNavigate('auth', { authTab: 'login' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar: 3-zone contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 rounded"
          >
            <SmartCareLogo />
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#overview"
              className="hover:text-navy-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#features"
              className="hover:text-navy-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-navy-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <button
              type="button"
              onClick={() => onNavigate('track')}
              className="hover:text-navy-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Track Complaint
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrimaryPortalClick}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              {user ? 'Open Dashboard' : 'Student Portal'}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-navy-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
            <a
              href="#overview"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-navy-900"
            >
              Overview
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-navy-900"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-navy-900"
            >
              How It Works
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('track');
              }}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-navy-900"
            >
              Track Complaint
            </button>
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handlePrimaryPortalClick();
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-navy-900 text-white text-sm font-medium text-center"
              >
                {user ? 'Open Dashboard' : 'Student Portal'}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Welcome Section */}
        <section id="overview" className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-sm font-semibold text-sky-600 mb-3">
                  College & University Campus Operations
                </p>
                <h1
                  className="font-display font-bold text-navy-900 tracking-tight leading-[1.1] mb-5 max-w-xl"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
                >
                  Your Voice Matters. We Make It Heard.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
                  SmartCare gives students a structured digital channel to report campus
                  facility, IT, hostel, and academic service issues—while giving college
                  administrators transparent tools to assign priority and resolve cases on time.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={handleSubmitComplaintClick}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span>Submit Complaint</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('track')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-300 bg-white text-navy-900 text-sm font-semibold hover:bg-sky-50 hover:border-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                  >
                    <Search className="w-4 h-4 text-sky-600" aria-hidden="true" />
                    <span>Track Complaint</span>
                  </button>
                </div>

                {!user && (
                  <p className="mt-5 text-sm text-slate-500">
                    New student on campus?{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('auth', { authTab: 'register' })}
                      className="font-semibold text-sky-600 hover:text-navy-900 underline underline-offset-4 cursor-pointer"
                    >
                      Register your student account
                    </button>{' '}
                    or sign in as an administrator.
                  </p>
                )}
              </div>

              <div className="lg:col-span-6 flex">
                <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-navy-900 min-h-[280px] lg:min-h-[400px] relative">
                  {!heroImgFailed ? (
                    <img
                      src="/src/assets/images/hero_campus_courtyard_1794897688290.jpg"
                      alt="Modern college campus courtyard with glass academic buildings and sunlit walkways"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover lg:h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-navy-900 to-navy-700 text-white">
                      <Building2 className="w-12 h-12 text-sky-200 mb-3" aria-hidden="true" />
                      <p className="font-display font-semibold text-lg">
                        SmartCare Campus Operations
                      </p>
                      <p className="text-sm text-sky-100 mt-1">
                        Unified student grievance & facility maintenance portal
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full-width 4-column Campus Proof Strip below Hero */}
            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div>
                <p className="text-xs font-medium text-slate-500">Complaints Logged</p>
                <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-navy-900 tabular-nums">
                  {stats ? stats.totalComplaints : 6}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Tracked in campus ledger</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Resolved Cases</p>
                <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-navy-900 tabular-nums">
                  {stats ? stats.resolvedComplaints : 3}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Verified by department heads</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Active In Queue</p>
                <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-sky-600 tabular-nums">
                  {stats ? stats.activeCases : 3}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Pending or under repair</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Campus Departments</p>
                <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-navy-900 tabular-nums">
                  {stats ? stats.departmentsSupported : 8}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">IT, Hostel, Library & Academic</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section: Asymmetric Bento Grid */}
        <section id="features" className="py-16 lg:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-semibold text-sky-600 mb-2">Platform Capabilities</p>
              <h2
                className="font-display text-2xl sm:text-4xl font-bold text-navy-900 tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Built for clear accountability between students and campus teams
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Wide Feature 01 */}
              <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-navy-900">
                      01. Direct Campus Routing
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                      Every complaint is categorized across Hostel, Wi-Fi & IT, Classroom
                      Equipment, Library, Dining, Sanitation, Transport, and Administration—and
                      automatically routed to the responsible department queue.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3 text-xs font-medium text-slate-500">
                    <span>8 Campus Units</span>
                    <span aria-hidden="true">·</span>
                    <span>Structured Intake Form</span>
                  </div>
                </div>
                <div className="min-h-[220px] bg-sky-50">
                  {!centerImgFailed ? (
                    <img
                      src="/src/assets/images/campus_student_center_1794897688552.jpg"
                      alt="College students working on laptops inside a sunlit student center"
                      referrerPolicy="no-referrer"
                      onError={() => setCenterImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 bg-sky-100 text-navy-900">
                      <Building2 className="w-10 h-10 text-sky-600" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Feature 02 */}
              <div className="rounded-xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-5">
                    <Clock className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-navy-900">
                    02. Real-Time Status Timeline
                  </h3>
                  <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                    Follow each complaint from Pending review to In Progress fieldwork and final
                    Resolved confirmation with timestamped updates and official tracking codes.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onNavigate('track')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-navy-900 transition-colors cursor-pointer"
                  >
                    <span>Look up a tracking ID</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Compact Feature 03 */}
              <div className="rounded-xl bg-navy-900 text-white p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-sky-200 mb-5">
                    <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
                    03. Priority Triage & Escalation
                  </h3>
                  <p className="mt-3 text-sm sm:text-base text-sky-100/90 leading-relaxed">
                    Campus administrators assign Low, Medium, High, or Urgent severity levels so
                    electrical hazards, dorm plumbing failures, or network outages receive immediate
                    attention.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-navy-800 text-xs text-sky-200">
                  Role-Based Student & Admin Access
                </div>
              </div>

              {/* Wide Feature 04 */}
              <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                <div className="min-h-[220px] bg-sky-50 order-2 md:order-1">
                  {!deskImgFailed ? (
                    <img
                      src="/src/assets/images/campus_support_desk_1794897689240.jpg"
                      alt="University student services and campus operations reception hall"
                      referrerPolicy="no-referrer"
                      onError={() => setDeskImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 bg-sky-100 text-navy-900">
                      <ClipboardCheck className="w-10 h-10 text-sky-600" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="p-6 sm:p-8 flex flex-col justify-between order-1 md:order-2">
                  <div>
                    <h3 className="font-display text-xl font-bold text-navy-900">
                      04. Transparent Resolution Notes
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                      No silent tickets. Whenever a facilities officer or administrator updates a
                      status or logs technician dispatch notes, the student sees the exact action
                      history in their dashboard.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3 text-xs font-medium text-slate-500">
                    <span>Audit Trail Preserved</span>
                    <span aria-hidden="true">·</span>
                    <span>Instant Dashboard Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 lg:py-24 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-sky-600 mb-2">How It Works</p>
                <h2
                  className="font-display text-2xl sm:text-4xl font-bold text-navy-900 tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  Four clear steps from submission to verified fix
                </h2>
              </div>
              <button
                type="button"
                onClick={handleSubmitComplaintClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-50 text-navy-900 border border-sky-200 text-sm font-semibold hover:bg-sky-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
              >
                <span>Start a Submission</span>
                <ArrowRight className="w-4 h-4 text-sky-600" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-200">
              {[
                {
                  step: '01',
                  title: 'Register & Sign In',
                  desc: 'Create your student account with your college email or sign in to access your personal complaint dashboard.',
                },
                {
                  step: '02',
                  title: 'Submit Issue Details',
                  desc: 'Enter the complaint title, select a campus category, specify the building or room, and describe the issue.',
                },
                {
                  step: '03',
                  title: 'Admin Triage & Priority',
                  desc: 'Operations staff review your report, assign a priority level, and dispatch the relevant campus unit.',
                },
                {
                  step: '04',
                  title: 'Track Until Resolved',
                  desc: 'Monitor status transitions and read official technician and resolution notes using your tracking ID.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="pt-8 pb-6 sm:pr-8 border-b lg:border-b-0 lg:border-r last:border-r-0 border-slate-200 lg:pl-6 first:lg:pl-0"
                >
                  <span className="font-mono text-sm font-semibold text-sky-600 tabular-nums">
                    Step {item.step}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-navy-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Contact Information */}
      <footer className="bg-navy-950 text-slate-300 border-t border-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <SmartCareLogo light />
              <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
                SmartCare is the campus complaint management system connecting students with
                facilities, IT, residential life, and academic administration.
              </p>
            </div>

            <div className="md:col-span-3">
              <h4 className="font-display text-sm font-semibold text-white mb-4">Navigation</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Home Overview
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleSubmitComplaintClick}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Submit Complaint
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('track')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Track Complaint
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('auth', { authTab: 'login' })}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Student & Admin Sign In
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="font-display text-sm font-semibold text-white mb-4">
                Campus Support Contact
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-sky-200 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>Student Affairs & Operations Hall, Room 104, University Campus</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-sky-200 shrink-0" aria-hidden="true" />
                  <a
                    href="mailto:support@smartcare.edu"
                    className="hover:text-white transition-colors"
                  >
                    support@smartcare.edu
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-sky-200 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums">+1 (555) 234-8910 · Mon–Fri, 8:00 AM – 6:00 PM</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} SmartCare Campus Operations. All rights reserved.</p>
            <p>Designed for College & Educational Institutions</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
