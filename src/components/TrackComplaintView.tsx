import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
} from 'lucide-react';
import { trackComplaint } from '../lib/api';
import type { PublicTrackResult, User } from '../types/smartcare';
import {
  ErrorBanner,
  PriorityLabel,
  SmartCareLogo,
  StatusLabel,
} from './StatusIndicator';

interface TrackComplaintViewProps {
  user: User | null;
  initialTrackingCode?: string;
  onBack: () => void;
  onGoPortal: () => void;
}

const SAMPLE_CODES = ['SC-2026-1001', 'SC-2026-1002', 'SC-2026-1003', 'SC-2026-1004'];

export function TrackComplaintView({
  user,
  initialTrackingCode = '',
  onBack,
  onGoPortal,
}: TrackComplaintViewProps) {
  const [query, setQuery] = useState(initialTrackingCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublicTrackResult | null>(null);

  const runLookup = async (codeToSearch: string) => {
    const clean = codeToSearch.trim();
    if (!clean) {
      setError('Please enter a complaint tracking ID (for example, SC-2026-1001).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await trackComplaint(clean);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Unable to find complaint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrackingCode) {
      setQuery(initialTrackingCode);
      runLookup(initialTrackingCode);
    }
  }, [initialTrackingCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runLookup(query);
  };

  const progressStage =
    result?.status === 'Resolved'
      ? 3
      : result?.status === 'In Progress'
      ? 2
      : result?.status === 'Rejected'
      ? 3
      : 1;

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
            <span>Back</span>
          </button>

          <SmartCareLogo />

          <button
            type="button"
            onClick={onGoPortal}
            className="px-4 py-2 rounded-lg bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8">
          <p className="text-sm font-semibold text-sky-600 mb-2">Complaint Tracking</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-900 tracking-tight">
            Check live complaint progress
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Enter your SmartCare tracking ID to view current status, assigned campus department,
            and official resolution updates.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs"
        >
          <label
            htmlFor="tracking-code-input"
            className="block text-sm font-medium text-navy-900 mb-2"
          >
            Complaint Tracking ID
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="tracking-code-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. SC-2026-1001"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm font-mono text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {loading ? 'Searching...' : 'Track Status'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Sample tracking IDs:</span>
            {SAMPLE_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setQuery(code);
                  runLookup(code);
                }}
                className="font-mono font-medium text-sky-700 hover:text-navy-900 hover:underline underline-offset-2 cursor-pointer px-1.5 py-0.5 rounded bg-sky-50"
              >
                {code}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div className="mt-6">
            <ErrorBanner message={error} />
          </div>
        )}

        {result && (
          <section className="mt-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="font-mono font-semibold text-navy-900">
                    {result.trackingCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{result.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    Filed {result.submissionDate}
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900">
                  {result.title}
                </h2>
              </div>

              <div className="flex items-center gap-4 shrink-0 pt-1">
                <PriorityLabel priority={result.priority} />
                <span className="text-slate-300" aria-hidden="true">
                  |
                </span>
                <StatusLabel status={result.status} />
              </div>
            </div>

            {/* 3-Step Visual Progress Bar */}
            <div className="py-6 border-b border-slate-200">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { step: 1, label: 'Submitted' },
                  { step: 2, label: 'In Progress' },
                  {
                    step: 3,
                    label: result.status === 'Rejected' ? 'Closed / Reviewed' : 'Resolved',
                  },
                ].map((stage) => {
                  const completed = progressStage >= stage.step;
                  return (
                    <div key={stage.step} className="space-y-2">
                      <div
                        className={`h-2 rounded-full transition-colors ${
                          completed ? 'bg-navy-900' : 'bg-slate-200'
                        }`}
                      />
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {completed ? (
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-sky-600 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        )}
                        <span className={completed ? 'text-navy-900' : 'text-slate-400'}>
                          {stage.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-200 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Assigned Campus Unit</p>
                <p className="font-medium text-navy-900 inline-flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600 shrink-0" aria-hidden="true" />
                  <span>{result.assignedDepartment}</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Campus Location</p>
                <p className="font-medium text-navy-900 inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0" aria-hidden="true" />
                  <span>{result.location || 'General Campus'}</span>
                </p>
              </div>
            </div>

            {/* Chronological Activity Timeline */}
            <div className="pt-6">
              <h3 className="font-display text-sm font-semibold text-navy-900 mb-4">
                Official Activity Timeline
              </h3>
              <ol className="space-y-4">
                {result.updates.map((upd) => (
                  <li
                    key={upd.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-4 border-b last:border-b-0 border-slate-100"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-navy-900">{upd.authorName}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {upd.authorRole === 'admin' ? 'Campus Operations' : 'Student'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <StatusLabel status={upd.statusAfter} />
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{upd.note}</p>
                    </div>
                    <time className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
                      {new Date(upd.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
