import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import type { ComplaintPriority, ComplaintStatus } from '../types/smartcare';

export function SmartCareLogo({
  light = false,
  size = 'md',
}: {
  light?: boolean;
  size?: 'sm' | 'md';
}) {
  const boxSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-base' : 'text-lg';
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${boxSize} shrink-0`}
        aria-hidden="true"
      >
        <rect
          width="32"
          height="32"
          rx="8"
          className={light ? 'fill-sky-100' : 'fill-navy-900'}
        />
        <path
          d="M16 6.5L24 10V15.8C24 20.6 20.6 24.8 16 26C11.4 24.8 8 20.6 8 15.8V10L16 6.5Z"
          className={light ? 'stroke-navy-900' : 'stroke-sky-200'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M12.5 16L14.9 18.4L19.8 13.5"
          className={light ? 'stroke-sky-600' : 'stroke-white'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`font-display font-bold tracking-tight ${textSize} ${
          light ? 'text-white' : 'text-navy-900'
        }`}
      >
        SmartCare
      </span>
    </span>
  );
}

export function StatusLabel({ status }: { status: ComplaintStatus }) {
  switch (status) {
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          <span>Pending</span>
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 whitespace-nowrap shrink-0">
          <RefreshCw className="w-3.5 h-3.5 text-sky-600 shrink-0" aria-hidden="true" />
          <span>In Progress</span>
        </span>
      );
    case 'Resolved':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Resolved</span>
        </span>
      );
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 whitespace-nowrap shrink-0">
          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          <span>Closed / Rejected</span>
        </span>
      );
  }
}

export function PriorityLabel({ priority }: { priority: ComplaintPriority }) {
  switch (priority) {
    case 'Urgent':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 whitespace-nowrap shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          <span>Urgent</span>
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap shrink-0">
          <ArrowUp className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          <span>High</span>
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 whitespace-nowrap shrink-0">
          <ArrowRight className="w-3.5 h-3.5 text-sky-600 shrink-0" aria-hidden="true" />
          <span>Medium</span>
        </span>
      );
    case 'Low':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap shrink-0">
          <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          <span>Low</span>
        </span>
      );
  }
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
