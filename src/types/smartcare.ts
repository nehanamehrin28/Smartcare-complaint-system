export type UserRole = 'student' | 'admin';

export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export const COMPLAINT_CATEGORIES = [
  'Hostel & Accommodation',
  'Classroom & Lab Equipment',
  'Wi-Fi & IT Services',
  'Library & Study Spaces',
  'Cafeteria & Dining',
  'Campus Sanitation & Maintenance',
  'Transport & Parking',
  'Academic & Administration',
] as const;

export const CAMPUS_DEPARTMENTS = [
  'Student Affairs Office',
  'IT Infrastructure & Network Services',
  'Facilities & Maintenance Engineering',
  'Hostel & Residential Life',
  'Academic Administration',
  'Campus Health & Sanitation',
  'Library Operations',
  'Campus Transport Unit',
] as const;

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  studentId: string | null;
  department: string | null;
  createdAt: string;
}

export interface ComplaintUpdate {
  id: number;
  complaintId: number;
  authorName: string;
  authorRole: UserRole;
  statusAfter: ComplaintStatus;
  note: string;
  createdAt: string;
}

export interface Complaint {
  id: number;
  trackingCode: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentRollId: string | null;
  studentDepartment: string | null;
  title: string;
  category: string;
  location: string;
  description: string;
  submissionDate: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedDepartment: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
  updates?: ComplaintUpdate[];
}

export interface PublicTrackResult {
  trackingCode: string;
  title: string;
  category: string;
  location: string;
  submissionDate: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedDepartment: string;
  adminNote: string;
  updatedAt: string;
  updates: ComplaintUpdate[];
}

export interface DashboardSummary {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  urgentOrHigh: number;
}
