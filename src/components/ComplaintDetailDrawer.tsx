import { useEffect, useState } from 'react';
import { Building2, Calendar, MapPin, Save, User as UserIcon, X } from 'lucide-react';
import { updateComplaint } from '../lib/api';
import {
  CAMPUS_DEPARTMENTS,
  type Complaint,
  type ComplaintPriority,
  type ComplaintStatus,
  type User,
} from '../types/smartcare';
import { ErrorBanner, PriorityLabel, StatusLabel } from './StatusIndicator';

interface ComplaintDetailDrawerProps {
  complaint: Complaint | null;
  user: User;
  onClose: () => void;
  onUpdated: (updated: Complaint) => void;
}

const STATUS_OPTIONS: ComplaintStatus[] = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const PRIORITY_OPTIONS: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export function ComplaintDetailDrawer({
  complaint,
  user,
  onClose,
  onUpdated,
}: ComplaintDetailDrawerProps) {
  const [status, setStatus] = useState<ComplaintStatus>('Pending');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [assignedDepartment, setAssignedDepartment] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status);
      setPriority(complaint.priority);
      setAssignedDepartment(complaint.assignedDepartment);
      setAdminNote(complaint.adminNote || '');
      setError(null);
      setSavedNotice(false);
    }
  }, [complaint]);

  if (!complaint) return null;

  const isAdmin = user.role === 'admin';

  const handleSaveAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedNotice(false);
    try {
      const updated = await updateComplaint(complaint.id, {
        status,
        priority,
        assignedDepartment,
        adminNote,
      });
      onUpdated(updated);
      setSavedNotice(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save complaint update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-navy-950/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-complaint-title"
    >
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto border-l border-slate-200 flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold text-sky-700">
              {complaint.trackingCode}
            </p>
            <h2
              id="drawer-complaint-title"
              className="font-display text-lg font-bold text-navy-900 truncate"
            >
              {complaint.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close complaint details"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-navy-900 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Status + Priority + Metadata */}
          <div className="flex flex-wrap items-center gap-4 pb-5 border-b border-slate-200">
            <StatusLabel status={complaint.status} />
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <PriorityLabel priority={complaint.priority} />
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="text-xs font-medium text-slate-600">{complaint.category}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pb-5 border-b border-slate-200">
            <div className="flex items-start gap-2.5">
              <UserIcon className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-slate-500">Submitted By</p>
                <p className="font-medium text-navy-900">
                  {complaint.studentName}
                  {complaint.studentRollId ? ` · ${complaint.studentRollId}` : ''}
                </p>
                {complaint.studentDepartment && (
                  <p className="text-xs text-slate-500">{complaint.studentDepartment}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-slate-500">Submission Date</p>
                <p className="font-mono font-medium text-navy-900 tabular-nums">
                  {complaint.submissionDate}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="font-medium text-navy-900">
                  {complaint.location || 'General Campus'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-slate-500">Assigned Department</p>
                <p className="font-medium text-navy-900">{complaint.assignedDepartment}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="pb-5 border-b border-slate-200">
            <h3 className="font-display text-sm font-semibold text-navy-900 mb-2">
              Complaint Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {complaint.description}
            </p>
          </div>

          {/* Admin Triage Controls */}
          {isAdmin && (
            <form
              onSubmit={handleSaveAdminUpdate}
              className="bg-sky-50/60 border border-sky-200 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-navy-900">
                  Administrator Triage & Resolution Controls
                </h3>
                {savedNotice && (
                  <span className="text-xs font-semibold text-emerald-700">
                    Saved to ledger
                  </span>
                )}
              </div>

              {error && <ErrorBanner message={error} />}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="admin-status"
                    className="block text-xs font-semibold text-navy-900 mb-1"
                  >
                    Update Status
                  </label>
                  <select
                    id="admin-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-priority"
                    className="block text-xs font-semibold text-navy-900 mb-1"
                  >
                    Assign Priority
                  </label>
                  <select
                    id="admin-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-department"
                  className="block text-xs font-semibold text-navy-900 mb-1"
                >
                  Assigned Campus Unit
                </label>
                <select
                  id="admin-department"
                  value={assignedDepartment}
                  onChange={(e) => setAssignedDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {CAMPUS_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="admin-note"
                  className="block text-xs font-semibold text-navy-900 mb-1"
                >
                  Official Resolution / Dispatch Update
                </label>
                <textarea
                  id="admin-note"
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Enter technician assignment, scheduled inspection date, or resolution summary..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  <span>{saving ? 'Saving...' : 'Save Update'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Student View of Latest Official Note */}
          {!isAdmin && complaint.adminNote && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-navy-900 mb-1">
                Latest Campus Administration Remark
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{complaint.adminNote}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="font-display text-sm font-semibold text-navy-900 mb-4">
              Resolution Timeline
            </h3>
            <ol className="space-y-4">
              {(complaint.updates || []).map((upd) => (
                <li
                  key={upd.id}
                  className="pb-4 border-b last:border-b-0 border-slate-100 flex flex-col gap-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-900">{upd.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <StatusLabel status={upd.statusAfter} />
                    </div>
                    <time className="font-mono tabular-nums text-slate-400">
                      {new Date(upd.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{upd.note}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
