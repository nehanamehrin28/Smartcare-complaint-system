import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FilePlus2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { fetchComplaints } from '../lib/api';
import {
  COMPLAINT_CATEGORIES,
  type Complaint,
  type DashboardSummary,
  type User,
} from '../types/smartcare';
import { ComplaintDetailDrawer } from './ComplaintDetailDrawer';
import { ComplaintFormView } from './ComplaintFormView';
import {
  ErrorBanner,
  PriorityLabel,
  SmartCareLogo,
  StatusLabel,
} from './StatusIndicator';

interface DashboardWorkspaceProps {
  user: User;
  initialView?: 'overview' | 'submit';
  onLogout: () => void;
  onGoHome: () => void;
  onGoTrack: (trackingCode?: string) => void;
}

const STATUS_TABS = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'] as const;
const PRIORITY_FILTERS = ['All', 'Urgent', 'High', 'Medium', 'Low'] as const;

export function DashboardWorkspace({
  user,
  initialView = 'overview',
  onLogout,
  onGoHome,
  onGoTrack,
}: DashboardWorkspaceProps) {
  const [activeView, setActiveView] = useState<'overview' | 'submit'>(initialView);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    urgentOrHigh: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        q: searchQuery,
      });
      setComplaints(data.complaints);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const categoryBreakdown = useMemo(() => {
    if (!isAdmin || complaints.length === 0) return [];
    const counts = new Map<string, number>();
    for (const c of complaints) {
      counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [complaints, isAdmin]);

  const handleComplaintUpdated = (updated: Complaint) => {
    setSelectedComplaint(updated);
    loadComplaints();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy-900 text-white">
      <div className="h-16 px-5 flex items-center justify-between border-b border-navy-800">
        <button
          type="button"
          onClick={onGoHome}
          className="cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 rounded"
        >
          <SmartCareLogo light size="sm" />
        </button>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-sky-200 hover:bg-navy-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-5 py-4 border-b border-navy-800">
        <p className="text-xs font-medium text-sky-200">
          {isAdmin ? 'Administrator Console' : 'Student Portal'}
        </p>
        <p className="mt-0.5 font-display text-sm font-semibold text-white truncate">
          {user.name}
        </p>
        <p className="text-xs text-slate-300 truncate">
          {user.studentId ? `${user.studentId} · ` : ''}
          {user.department || user.email}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Workspace navigation">
        <button
          type="button"
          onClick={() => {
            setActiveView('overview');
            setMobileSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeView === 'overview'
              ? 'bg-navy-800 text-white'
              : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-sky-200 shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">
            {isAdmin ? 'All Campus Complaints' : 'Student Dashboard'}
          </span>
        </button>

        {!isAdmin && (
          <button
            type="button"
            onClick={() => {
              setActiveView('submit');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeView === 'submit'
                ? 'bg-navy-800 text-white'
                : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
            }`}
          >
            <FilePlus2 className="w-4 h-4 text-sky-200 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">Submit Complaint</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setMobileSidebarOpen(false);
            onGoTrack();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-800/60 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4 text-sky-200 shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">Track by ID</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileSidebarOpen(false);
            onGoHome();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-800/60 transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4 text-sky-200 shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">Public Home</span>
        </button>
      </nav>

      <div className="p-3 border-t border-navy-800">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-sky-200 shrink-0" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-navy-900">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-68 max-w-[80vw] h-full">{sidebarContent}</div>
          <div
            className="flex-1 bg-navy-950/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-navy-900 hover:bg-slate-50 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-500 truncate">
              <span className="font-medium text-navy-900">SmartCare</span>
              <span aria-hidden="true">/</span>
              <span className="truncate">
                {activeView === 'submit'
                  ? 'Submit Complaint'
                  : isAdmin
                  ? 'Administrator Console'
                  : 'Student Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!isAdmin && activeView === 'overview' && (
              <button
                type="button"
                onClick={() => setActiveView('submit')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4" aria-hidden="true" />
                <span>Submit New Complaint</span>
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={loadComplaints}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-navy-900 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <span>Refresh Queue</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl w-full mx-auto">
          {activeView === 'submit' && !isAdmin ? (
            <ComplaintFormView
              user={user}
              onSubmitted={() => {
                loadComplaints();
              }}
              onTrackCode={(code) => onGoTrack(code)}
              onCancel={() => setActiveView('overview')}
            />
          ) : (
            <div className="space-y-8">
              {/* Welcome Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 mb-1">
                    {isAdmin && <ShieldCheck className="w-4 h-4" aria-hidden="true" />}
                    <span>
                      {isAdmin
                        ? 'Campus Operations & Grievance Administration'
                        : 'Student Complaint Portal'}
                    </span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
                    Welcome back, {user.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {isAdmin
                      ? 'Review incoming campus reports, assign severity priorities, and post resolution updates.'
                      : 'Monitor your submitted complaints, check department remarks, or file a new campus issue.'}
                  </p>
                </div>
              </div>

              {/* 4-Column KPI Summary Strip (Single Elevation, Zero Nested Cards) */}
              <section
                aria-label="Complaint statistics"
                className="bg-white border border-slate-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200"
              >
                <div className="p-5 sm:p-6">
                  <p className="text-xs font-medium text-slate-500">
                    {isAdmin ? 'Total Campus Complaints' : 'Total Submitted'}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold text-navy-900 tabular-nums">
                    {summary.total}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">All recorded filings</p>
                </div>

                <div className="p-5 sm:p-6 border-l border-slate-200 lg:border-l-0">
                  <p className="text-xs font-medium text-slate-500">Pending Review</p>
                  <p className="mt-2 font-display text-3xl font-bold text-amber-600 tabular-nums">
                    {summary.pending}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Awaiting triage</p>
                </div>

                <div className="p-5 sm:p-6">
                  <p className="text-xs font-medium text-slate-500">
                    {isAdmin ? 'In Progress' : 'In Progress'}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold text-sky-600 tabular-nums">
                    {summary.inProgress}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {isAdmin
                      ? `${summary.urgentOrHigh} high or urgent`
                      : 'Active department work'}
                  </p>
                </div>

                <div className="p-5 sm:p-6 border-l border-slate-200 lg:border-l-0">
                  <p className="text-xs font-medium text-slate-500">Resolved</p>
                  <p className="mt-2 font-display text-3xl font-bold text-emerald-700 tabular-nums">
                    {summary.resolved}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Completed & verified</p>
                </div>
              </section>

              {/* Admin Category Breakdown Bar */}
              {isAdmin && categoryBreakdown.length > 0 && (
                <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
                  <h2 className="font-display text-sm font-semibold text-navy-900 mb-4">
                    Volume by Campus Category
                  </h2>
                  <div className="space-y-3">
                    {categoryBreakdown.map(([cat, count]) => {
                      const pct = Math.round((count / Math.max(complaints.length, 1)) * 100);
                      return (
                        <div key={cat} className="grid grid-cols-12 items-center gap-3 text-xs">
                          <span className="col-span-5 sm:col-span-4 font-medium text-slate-700 truncate">
                            {cat}
                          </span>
                          <div className="col-span-5 sm:col-span-7 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-navy-900 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="col-span-2 sm:col-span-1 text-right font-mono text-slate-600 tabular-nums">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Search & Filter Toolbar + Data Table */}
              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Interactive Segmented Status Filter */}
                    <div
                      role="tablist"
                      aria-label="Filter by complaint status"
                      className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start"
                    >
                      {STATUS_TABS.map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          role="tab"
                          aria-selected={statusFilter === tab}
                          onClick={() => setStatusFilter(tab)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            statusFilter === tab
                              ? 'bg-white text-navy-900 shadow-xs'
                              : 'text-slate-600 hover:text-navy-900'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Search & Select Filters */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="relative flex-1 sm:w-56">
                        <Search
                          className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                          aria-hidden="true"
                        />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search ID, title, room..."
                          aria-label="Search complaints"
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <select
                        aria-label="Filter by category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="All">All Categories</option>
                        {COMPLAINT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      {isAdmin && (
                        <select
                          aria-label="Filter by priority"
                          value={priorityFilter}
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          {PRIORITY_FILTERS.map((p) => (
                            <option key={p} value={p}>
                              {p === 'All' ? 'All Priorities' : `${p} Priority`}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-5">
                    <ErrorBanner message={error} />
                  </div>
                )}

                {loading ? (
                  <div className="divide-y divide-slate-100">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="h-3.5 w-28 bg-slate-200 rounded animate-pulse" />
                          <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <p className="font-display text-base font-semibold text-navy-900">
                      No matching complaints found
                    </p>
                    <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                      {statusFilter !== 'All' || categoryFilter !== 'All' || searchQuery
                        ? 'Try clearing your active filters or search terms.'
                        : isAdmin
                        ? 'No campus complaints have been submitted yet.'
                        : 'You have not filed any complaints yet. Submit your first campus issue to start tracking.'}
                    </p>
                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={() => setActiveView('submit')}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors cursor-pointer"
                      >
                        <FilePlus2 className="w-4 h-4" aria-hidden="true" />
                        <span>Submit First Complaint</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                          <th className="py-3 px-5 whitespace-nowrap">Tracking ID</th>
                          <th className="py-3 px-4">Complaint</th>
                          {isAdmin && <th className="py-3 px-4 whitespace-nowrap">Student</th>}
                          <th className="py-3 px-4 whitespace-nowrap">Category</th>
                          <th className="py-3 px-4 whitespace-nowrap">Submitted</th>
                          <th className="py-3 px-4 whitespace-nowrap">Priority</th>
                          <th className="py-3 px-4 whitespace-nowrap">Status</th>
                          <th className="py-3 px-5 text-right whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {complaints.map((c) => (
                          <tr
                            key={c.id}
                            onClick={() => setSelectedComplaint(c)}
                            className="hover:bg-sky-50/50 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-5 font-mono text-xs font-semibold text-navy-900 whitespace-nowrap tabular-nums">
                              {c.trackingCode}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <p className="font-medium text-navy-900 truncate">{c.title}</p>
                              <p className="text-xs text-slate-500 truncate">
                                {c.location || c.assignedDepartment}
                              </p>
                            </td>
                            {isAdmin && (
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <p className="text-xs font-medium text-navy-900">
                                  {c.studentName}
                                </p>
                                <p className="text-xs text-slate-500 font-mono">
                                  {c.studentRollId || 'Student'}
                                </p>
                              </td>
                            )}
                            <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                              {c.category}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap tabular-nums">
                              {c.submissionDate}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <PriorityLabel priority={c.priority} />
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <StatusLabel status={c.status} />
                            </td>
                            <td className="py-3.5 px-5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedComplaint(c);
                                }}
                                className="text-xs font-semibold text-sky-700 hover:text-navy-900 hover:underline underline-offset-2 cursor-pointer"
                              >
                                {isAdmin ? 'Manage' : 'View'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      <ComplaintDetailDrawer
        complaint={selectedComplaint}
        user={user}
        onClose={() => setSelectedComplaint(null)}
        onUpdated={handleComplaintUpdated}
      />
    </div>
  );
}
