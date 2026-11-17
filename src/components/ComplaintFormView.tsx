import { useState } from 'react';
import { ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import { submitComplaint } from '../lib/api';
import {
  COMPLAINT_CATEGORIES,
  type Complaint,
  type User,
} from '../types/smartcare';
import { ErrorBanner } from './StatusIndicator';

interface ComplaintFormViewProps {
  user: User;
  onSubmitted: (complaint: Complaint) => void;
  onTrackCode: (trackingCode: string) => void;
  onCancel: () => void;
}

export function ComplaintFormView({
  user,
  onSubmitted,
  onTrackCode,
  onCancel,
}: ComplaintFormViewProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(COMPLAINT_CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [submissionDate, setSubmissionDate] = useState(today);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await submitComplaint({
        title,
        category,
        location,
        description,
        submissionDate,
      });
      setCreatedComplaint(created);
      onSubmitted(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  if (createdComplaint) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-5">
          <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy-900">
          Complaint Submitted Successfully
        </h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Your report has been logged and routed to{' '}
          <span className="font-semibold text-navy-900">
            {createdComplaint.assignedDepartment}
          </span>
          . Save your tracking ID below to monitor progress at any time.
        </p>

        <div className="mt-6 py-4 px-5 rounded-lg bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Assigned Tracking ID</p>
            <p className="font-mono text-xl font-bold text-navy-900 tabular-nums mt-0.5">
              {createdComplaint.trackingCode}
            </p>
          </div>
          <div className="text-xs text-slate-600">
            <span>Status: </span>
            <span className="font-semibold text-amber-700">{createdComplaint.status}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onTrackCode(createdComplaint.trackingCode)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <span>Track This Complaint</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-navy-900 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
          Submit a New Complaint
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Filed by <span className="font-medium text-navy-900">{user.name}</span>
          {user.studentId ? ` · ${user.studentId}` : ''}. Provide accurate details so campus
          operations can resolve the issue quickly.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5"
      >
        {error && <ErrorBanner message={error} />}

        <div>
          <label
            htmlFor="complaint-title"
            className="block text-sm font-medium text-navy-900 mb-1.5"
          >
            Complaint Title
          </label>
          <input
            id="complaint-title"
            type="text"
            required
            minLength={4}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Broken air conditioning unit in Lecture Hall 102"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="complaint-category"
              className="block text-sm font-medium text-navy-900 mb-1.5"
            >
              Complaint Category
            </label>
            <select
              id="complaint-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-navy-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              {COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="complaint-date"
              className="block text-sm font-medium text-navy-900 mb-1.5"
            >
              Submission Date
            </label>
            <input
              id="complaint-date"
              type="date"
              required
              value={submissionDate}
              onChange={(e) => setSubmissionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="complaint-location"
            className="block text-sm font-medium text-navy-900 mb-1.5"
          >
            Campus Building / Room Location
          </label>
          <input
            id="complaint-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Science Block B, 2nd Floor Room 204"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div>
          <label
            htmlFor="complaint-description"
            className="block text-sm font-medium text-navy-900 mb-1.5"
          >
            Detailed Description
          </label>
          <textarea
            id="complaint-description"
            required
            minLength={12}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, when it started, and how it affects students or classes..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 leading-relaxed"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Minimum 12 characters. Include room numbers, equipment IDs, or time windows if
            applicable.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span>{submitting ? 'Submitting...' : 'Submit Complaint'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
