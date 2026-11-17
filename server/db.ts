import crypto from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintUpdate,
  DashboardSummary,
  PublicTrackResult,
  User,
  UserRole,
} from '../src/types/smartcare.ts';

const dbPath = process.env.SMARTCARE_DB_PATH || path.join(process.cwd(), 'smartcare.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    student_id TEXT,
    department TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_code TEXT UNIQUE NOT NULL,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    submission_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    priority TEXT NOT NULL DEFAULT 'Medium',
    assigned_department TEXT NOT NULL DEFAULT 'Student Affairs Office',
    admin_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS complaint_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    status_after TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hashHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function defaultDepartmentForCategory(category: string): string {
  switch (category) {
    case 'Wi-Fi & IT Services':
      return 'IT Infrastructure & Network Services';
    case 'Hostel & Accommodation':
      return 'Hostel & Residential Life';
    case 'Classroom & Lab Equipment':
      return 'Facilities & Maintenance Engineering';
    case 'Library & Study Spaces':
      return 'Library Operations';
    case 'Cafeteria & Dining':
    case 'Campus Sanitation & Maintenance':
      return 'Campus Health & Sanitation';
    case 'Transport & Parking':
      return 'Campus Transport Unit';
    case 'Academic & Administration':
      return 'Academic Administration';
    default:
      return 'Student Affairs Office';
  }
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  student_id: string | null;
  department: string | null;
  created_at: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    studentId: row.student_id,
    department: row.department,
    createdAt: row.created_at,
  };
}

interface ComplaintJoinedRow {
  id: number;
  tracking_code: string;
  student_id: number;
  student_name: string;
  student_email: string;
  student_roll_id: string | null;
  student_department: string | null;
  title: string;
  category: string;
  location: string;
  description: string;
  submission_date: string;
  status: string;
  priority: string;
  assigned_department: string;
  admin_note: string;
  created_at: string;
  updated_at: string;
}

function mapComplaint(row: ComplaintJoinedRow): Complaint {
  return {
    id: row.id,
    trackingCode: row.tracking_code,
    studentId: row.student_id,
    studentName: row.student_name,
    studentEmail: row.student_email,
    studentRollId: row.student_roll_id,
    studentDepartment: row.student_department,
    title: row.title,
    category: row.category,
    location: row.location,
    description: row.description,
    submissionDate: row.submission_date,
    status: row.status as ComplaintStatus,
    priority: row.priority as ComplaintPriority,
    assignedDepartment: row.assigned_department,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface UpdateRow {
  id: number;
  complaint_id: number;
  author_name: string;
  author_role: string;
  status_after: string;
  note: string;
  created_at: string;
}

function mapUpdate(row: UpdateRow): ComplaintUpdate {
  return {
    id: row.id,
    complaintId: row.complaint_id,
    authorName: row.author_name,
    authorRole: row.author_role as UserRole,
    statusAfter: row.status_after as ComplaintStatus,
    note: row.note,
    createdAt: row.created_at,
  };
}

function seedInitialData() {
  const countRow = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  if (countRow.count > 0) return;

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
  const dateStrDaysAgo = (days: number) => daysAgo(days).slice(0, 10);

  const insertUser = db.prepare(
    `INSERT INTO users (name, email, password_hash, role, student_id, department, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const mayaResult = insertUser.run(
    'Maya Lin',
    'maya.lin@campus.edu',
    hashPassword('Student123!'),
    'student',
    'STU-2026-0418',
    'Computer Science',
    daysAgo(30)
  );
  const mayaId = Number(mayaResult.lastInsertRowid);

  const arjunResult = insertUser.run(
    'Arjun Patel',
    'arjun.patel@campus.edu',
    hashPassword('Student123!'),
    'student',
    'STU-2026-0502',
    'Electrical Engineering',
    daysAgo(25)
  );
  const arjunId = Number(arjunResult.lastInsertRowid);

  insertUser.run(
    'Dr. Elena Vance',
    'admin@smartcare.edu',
    hashPassword('Admin123!'),
    'admin',
    'ADM-101',
    'Campus Operations & Student Affairs',
    daysAgo(60)
  );

  const insertComplaint = db.prepare(
    `INSERT INTO complaints (
      tracking_code, student_id, title, category, location, description,
      submission_date, status, priority, assigned_department, admin_note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertUpdate = db.prepare(
    `INSERT INTO complaint_updates (complaint_id, author_name, author_role, status_after, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const c1 = insertComplaint.run(
    'SC-2026-1001',
    mayaId,
    'Intermittent Wi-Fi dropouts in North Hall study wing',
    'Wi-Fi & IT Services',
    'North Residence Hall, 3rd Floor Study Lounge',
    'Campus Eduroam wireless signal drops every 15 minutes during evening hours between 7 PM and 11 PM, affecting online lab submissions and exam prep.',
    dateStrDaysAgo(5),
    'In Progress',
    'High',
    'IT Infrastructure & Network Services',
    'Network team identified a faulty access point switch on Floor 3. Replacement hardware scheduled for installation tomorrow morning.',
    daysAgo(5),
    daysAgo(1)
  );
  const c1Id = Number(c1.lastInsertRowid);
  insertUpdate.run(c1Id, 'Maya Lin', 'student', 'Pending', 'Complaint filed with location details for North Hall Floor 3.', daysAgo(5));
  insertUpdate.run(c1Id, 'Dr. Elena Vance', 'admin', 'In Progress', 'Assigned High priority. IT Infrastructure dispatched technician to inspect access point AP-NH3-04.', daysAgo(3));
  insertUpdate.run(c1Id, 'Dr. Elena Vance', 'admin', 'In Progress', 'Faulty PoE switch confirmed. Replacement unit arriving and scheduled for install tomorrow at 9:00 AM.', daysAgo(1));

  const c2 = insertComplaint.run(
    'SC-2026-1002',
    mayaId,
    'Projector calibration and HDMI port failure in Lecture Room 204',
    'Classroom & Lab Equipment',
    'Science & Innovation Center, Room 204',
    'The ceiling-mounted projector displays a washed-out green tint and the podium HDMI port fails to detect laptops during afternoon lectures.',
    dateStrDaysAgo(11),
    'Resolved',
    'Medium',
    'Facilities & Maintenance Engineering',
    'HDMI wall plate replaced and projector lamp recalibrated. Verified working with both USB-C and HDMI adapters.',
    daysAgo(11),
    daysAgo(7)
  );
  const c2Id = Number(c2.lastInsertRowid);
  insertUpdate.run(c2Id, 'Maya Lin', 'student', 'Pending', 'Submitted issue for Room 204 AV podium.', daysAgo(11));
  insertUpdate.run(c2Id, 'Dr. Elena Vance', 'admin', 'In Progress', 'AV maintenance crew scheduled for inspection between classes.', daysAgo(9));
  insertUpdate.run(c2Id, 'Dr. Elena Vance', 'admin', 'Resolved', 'Replaced HDMI coupler and recalibrated projector color profile. Tested successfully.', daysAgo(7));

  const c3 = insertComplaint.run(
    'SC-2026-1003',
    mayaId,
    'Hot water pressure drop in East Wing Hostel showers',
    'Hostel & Accommodation',
    'East Wing Dormitory, Rooms 110–124',
    'Water pressure and temperature drop noticeably after 8:00 AM across the first-floor bathroom block.',
    dateStrDaysAgo(1),
    'Pending',
    'Medium',
    'Hostel & Residential Life',
    'Awaiting initial plumbing inspection from residential facilities team.',
    daysAgo(1),
    daysAgo(1)
  );
  const c3Id = Number(c3.lastInsertRowid);
  insertUpdate.run(c3Id, 'Maya Lin', 'student', 'Pending', 'Complaint logged for East Wing Dormitory first floor.', daysAgo(1));

  const c4 = insertComplaint.run(
    'SC-2026-1004',
    arjunId,
    'Power outlet strip loose at Central Library quiet desks',
    'Library & Study Spaces',
    'Central Library, 2nd Floor Quiet Zone (Row C)',
    'Two floor power boxes in Row C have loose sockets that spark slightly when laptop chargers are plugged in.',
    dateStrDaysAgo(2),
    'In Progress',
    'Urgent',
    'Facilities & Maintenance Engineering',
    'Marked Urgent for electrical safety. Outlets taped off and certified campus electrician assigned today.',
    daysAgo(2),
    daysAgo(0)
  );
  const c4Id = Number(c4.lastInsertRowid);
  insertUpdate.run(c4Id, 'Arjun Patel', 'student', 'Pending', 'Reported electrical outlet safety concern in Quiet Zone Row C.', daysAgo(2));
  insertUpdate.run(c4Id, 'Dr. Elena Vance', 'admin', 'In Progress', 'Escalated to Urgent priority. Campus electrician replacing floor receptacle modules today.', daysAgo(0));

  const c5 = insertComplaint.run(
    'SC-2026-1005',
    arjunId,
    'Evening shuttle bus 15-minute delay on West Gate loop',
    'Transport & Parking',
    'West Gate Shuttle Stop',
    'The 6:30 PM campus shuttle has arrived after 6:45 PM for four consecutive weekdays, causing students to miss evening lab sessions.',
    dateStrDaysAgo(8),
    'Resolved',
    'Low',
    'Campus Transport Unit',
    'Route timing adjusted by 10 minutes earlier at North Depot to absorb evening traffic at Oak Avenue intersection.',
    daysAgo(8),
    daysAgo(4)
  );
  const c5Id = Number(c5.lastInsertRowid);
  insertUpdate.run(c5Id, 'Arjun Patel', 'student', 'Pending', 'Reported recurring evening delay at West Gate stop.', daysAgo(8));
  insertUpdate.run(c5Id, 'Dr. Elena Vance', 'admin', 'In Progress', 'Transport Unit reviewing GPS logs from Route B evening shifts.', daysAgo(6));
  insertUpdate.run(c5Id, 'Dr. Elena Vance', 'admin', 'Resolved', 'Dispatch schedule updated; West Gate departure stabilized at 6:30 PM.', daysAgo(4));

  const c6 = insertComplaint.run(
    'SC-2026-1006',
    mayaId,
    'Extended weekend hours request & seating cleanliness in Commons Cafeteria',
    'Cafeteria & Dining',
    'Student Commons Dining Hall',
    'Tables near the west patio need more frequent bussing between 2 PM and 4 PM on weekdays.',
    dateStrDaysAgo(14),
    'Resolved',
    'Low',
    'Campus Health & Sanitation',
    'Dining services added an extra sanitation rotation at 2:30 PM daily.',
    daysAgo(14),
    daysAgo(10)
  );
  const c6Id = Number(c6.lastInsertRowid);
  insertUpdate.run(c6Id, 'Maya Lin', 'student', 'Pending', 'Submitted dining hall sanitation feedback.', daysAgo(14));
  insertUpdate.run(c6Id, 'Dr. Elena Vance', 'admin', 'Resolved', 'Additional afternoon bussing shift confirmed with dining operations.', daysAgo(10));
}

seedInitialData();

export function createSession(userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 86400000).toISOString();
  db.prepare(
    'INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).run(token, userId, expiresAt, now.toISOString());
  return token;
}

export function getUserBySessionToken(token: string): User | null {
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`
    )
    .get(token, new Date().toISOString()) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function registerStudent(params: {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  department?: string;
}): { user?: User; error?: string } {
  const normalizedEmail = params.email.trim().toLowerCase();
  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(normalizedEmail) as { id: number } | undefined;
  if (existing) {
    return { error: 'An account with this email address already exists.' };
  }

  const now = new Date().toISOString();
  const generatedStudentId =
    params.studentId?.trim() ||
    `STU-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const department = params.department?.trim() || 'General Studies';

  const res = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, student_id, department, created_at)
       VALUES (?, ?, ?, 'student', ?, ?, ?)`
    )
    .run(
      params.name.trim(),
      normalizedEmail,
      hashPassword(params.password),
      generatedStudentId,
      department,
      now
    );

  const row = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(Number(res.lastInsertRowid)) as unknown as UserRow;
  return { user: mapUser(row) };
}

export function authenticateUser(email: string, password: string): User | null {
  const normalizedEmail = email.trim().toLowerCase();
  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(normalizedEmail) as UserRow | undefined;
  if (!row) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return mapUser(row);
}

export function getUpdatesForComplaint(complaintId: number): ComplaintUpdate[] {
  const rows = db
    .prepare(
      'SELECT * FROM complaint_updates WHERE complaint_id = ? ORDER BY created_at ASC, id ASC'
    )
    .all(complaintId) as unknown as UpdateRow[];
  return rows.map(mapUpdate);
}

export function listComplaints(options: {
  user: User;
  status?: string;
  category?: string;
  priority?: string;
  q?: string;
}): { complaints: Complaint[]; summary: DashboardSummary } {
  const isStudent = options.user.role === 'student';
  const baseWhere = isStudent ? 'WHERE c.student_id = ?' : 'WHERE 1=1';
  const baseArgs = isStudent ? [options.user.id] : [];

  const allRows = db
    .prepare(
      `SELECT c.*, u.name AS student_name, u.email AS student_email,
              u.student_id AS student_roll_id, u.department AS student_department
       FROM complaints c
       JOIN users u ON u.id = c.student_id
       ${baseWhere}
       ORDER BY c.created_at DESC, c.id DESC`
    )
    .all(...baseArgs) as unknown as ComplaintJoinedRow[];

  const summary: DashboardSummary = {
    total: allRows.length,
    pending: allRows.filter((r) => r.status === 'Pending').length,
    inProgress: allRows.filter((r) => r.status === 'In Progress').length,
    resolved: allRows.filter((r) => r.status === 'Resolved').length,
    rejected: allRows.filter((r) => r.status === 'Rejected').length,
    urgentOrHigh: allRows.filter((r) => r.priority === 'Urgent' || r.priority === 'High').length,
  };

  let filtered = allRows.map((row) => ({
    ...mapComplaint(row),
    updates: getUpdatesForComplaint(row.id),
  }));

  if (options.status && options.status !== 'All') {
    filtered = filtered.filter((c) => c.status === options.status);
  }
  if (options.category && options.category !== 'All') {
    filtered = filtered.filter((c) => c.category === options.category);
  }
  if (options.priority && options.priority !== 'All') {
    filtered = filtered.filter((c) => c.priority === options.priority);
  }
  if (options.q && options.q.trim()) {
    const query = options.q.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.trackingCode.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        c.location.toLowerCase().includes(query) ||
        c.studentName.toLowerCase().includes(query)
    );
  }

  return { complaints: filtered, summary };
}

export function getComplaintById(id: number): Complaint | null {
  const row = db
    .prepare(
      `SELECT c.*, u.name AS student_name, u.email AS student_email,
              u.student_id AS student_roll_id, u.department AS student_department
       FROM complaints c
       JOIN users u ON u.id = c.student_id
       WHERE c.id = ?`
    )
    .get(id) as ComplaintJoinedRow | undefined;
  if (!row) return null;
  return {
    ...mapComplaint(row),
    updates: getUpdatesForComplaint(row.id),
  };
}

export function trackComplaintByCode(trackingCode: string): PublicTrackResult | null {
  const code = trackingCode.trim().toUpperCase();
  const row = db
    .prepare(
      `SELECT c.*, u.name AS student_name, u.email AS student_email,
              u.student_id AS student_roll_id, u.department AS student_department
       FROM complaints c
       JOIN users u ON u.id = c.student_id
       WHERE UPPER(c.tracking_code) = ?`
    )
    .get(code) as ComplaintJoinedRow | undefined;
  if (!row) return null;

  return {
    trackingCode: row.tracking_code,
    title: row.title,
    category: row.category,
    location: row.location,
    submissionDate: row.submission_date,
    status: row.status as ComplaintStatus,
    priority: row.priority as ComplaintPriority,
    assignedDepartment: row.assigned_department,
    adminNote: row.admin_note,
    updatedAt: row.updated_at,
    updates: getUpdatesForComplaint(row.id),
  };
}

function generateNextTrackingCode(): string {
  const year = new Date().getFullYear();
  const row = db
    .prepare('SELECT MAX(id) AS maxId FROM complaints')
    .get() as { maxId: number | null };
  const nextNum = 1001 + (row.maxId ?? 0);
  let candidate = `SC-${year}-${nextNum}`;
  let offset = 1;
  while (
    db.prepare('SELECT id FROM complaints WHERE tracking_code = ?').get(candidate)
  ) {
    candidate = `SC-${year}-${nextNum + offset}`;
    offset += 1;
  }
  return candidate;
}

export function createComplaint(params: {
  student: User;
  title: string;
  category: string;
  location: string;
  description: string;
  submissionDate: string;
}): Complaint {
  const now = new Date().toISOString();
  const trackingCode = generateNextTrackingCode();
  const assignedDepartment = defaultDepartmentForCategory(params.category);

  const res = db
    .prepare(
      `INSERT INTO complaints (
        tracking_code, student_id, title, category, location, description,
        submission_date, status, priority, assigned_department, admin_note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 'Medium', ?, '', ?, ?)`
    )
    .run(
      trackingCode,
      params.student.id,
      params.title.trim(),
      params.category.trim(),
      params.location.trim(),
      params.description.trim(),
      params.submissionDate,
      assignedDepartment,
      now,
      now
    );

  const complaintId = Number(res.lastInsertRowid);
  db.prepare(
    `INSERT INTO complaint_updates (complaint_id, author_name, author_role, status_after, note, created_at)
     VALUES (?, ?, ?, 'Pending', ?, ?)`
  ).run(
    complaintId,
    params.student.name,
    params.student.role,
    `Complaint submitted and routed to ${assignedDepartment}.`,
    now
  );

  return getComplaintById(complaintId)!;
}

export function updateComplaintByAdmin(params: {
  id: number;
  admin: User;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedDepartment: string;
  adminNote: string;
}): Complaint | null {
  const existing = getComplaintById(params.id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const cleanNote = params.adminNote.trim();
  const cleanDept = params.assignedDepartment.trim() || existing.assignedDepartment;

  db.prepare(
    `UPDATE complaints
     SET status = ?, priority = ?, assigned_department = ?, admin_note = ?, updated_at = ?
     WHERE id = ?`
  ).run(params.status, params.priority, cleanDept, cleanNote, now, params.id);

  const timelineNote =
    cleanNote && cleanNote !== existing.adminNote
      ? cleanNote
      : `Status set to ${params.status} · Priority: ${params.priority} · Assigned: ${cleanDept}`;

  db.prepare(
    `INSERT INTO complaint_updates (complaint_id, author_name, author_role, status_after, note, created_at)
     VALUES (?, ?, 'admin', ?, ?, ?)`
  ).run(params.id, params.admin.name, params.status, timelineNote, now);

  return getComplaintById(params.id);
}

export function getPublicCampusStats() {
  const rows = db
    .prepare('SELECT status, category FROM complaints')
    .all() as unknown as { status: string; category: string }[];
  const total = rows.length;
  const resolved = rows.filter((r) => r.status === 'Resolved').length;
  const active = rows.filter((r) => r.status === 'Pending' || r.status === 'In Progress').length;
  const recentCodes = db
    .prepare('SELECT tracking_code, title, status FROM complaints ORDER BY id DESC LIMIT 3')
    .all() as unknown as { tracking_code: string; title: string; status: string }[];

  return {
    totalComplaints: total,
    resolvedComplaints: resolved,
    activeCases: active,
    departmentsSupported: 8,
    sampleTrackingCodes: recentCodes.map((r) => ({
      trackingCode: r.tracking_code,
      title: r.title,
      status: r.status,
    })),
  };
}
