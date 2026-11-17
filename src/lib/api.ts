import type {
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
  DashboardSummary,
  PublicTrackResult,
  User,
} from '../types/smartcare';

const TOKEN_STORAGE_KEY = 'smartcare_auth_token';

export function getStoredToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export async function registerStudentAccount(payload: {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  department?: string;
}): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(data.token);
  return data;
}

export async function loginAccount(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(data.token);
  return data;
}

export async function logoutAccount(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } finally {
    setStoredToken(null);
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const data = await apiFetch<{ user: User }>('/api/auth/me');
    return data.user;
  } catch {
    setStoredToken(null);
    return null;
  }
}

export interface CampusOverviewStats {
  totalComplaints: number;
  resolvedComplaints: number;
  activeCases: number;
  departmentsSupported: number;
  sampleTrackingCodes: Array<{
    trackingCode: string;
    title: string;
    status: string;
  }>;
}

export async function fetchCampusOverview(): Promise<CampusOverviewStats> {
  return apiFetch<CampusOverviewStats>('/api/stats/overview');
}

export async function trackComplaint(trackingCode: string): Promise<PublicTrackResult> {
  return apiFetch<PublicTrackResult>(
    `/api/complaints/track/${encodeURIComponent(trackingCode.trim())}`
  );
}

export async function fetchComplaints(params?: {
  status?: string;
  category?: string;
  priority?: string;
  q?: string;
}): Promise<{ complaints: Complaint[]; summary: DashboardSummary }> {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== 'All') qs.set('status', params.status);
  if (params?.category && params.category !== 'All') qs.set('category', params.category);
  if (params?.priority && params.priority !== 'All') qs.set('priority', params.priority);
  if (params?.q && params.q.trim()) qs.set('q', params.q.trim());
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<{ complaints: Complaint[]; summary: DashboardSummary }>(
    `/api/complaints${suffix}`
  );
}

export async function submitComplaint(payload: {
  title: string;
  category: string;
  location: string;
  description: string;
  submissionDate: string;
}): Promise<Complaint> {
  return apiFetch<Complaint>('/api/complaints', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateComplaint(
  id: number,
  payload: {
    status: ComplaintStatus;
    priority: ComplaintPriority;
    assignedDepartment: string;
    adminNote: string;
  }
): Promise<Complaint> {
  return apiFetch<Complaint>(`/api/complaints/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
