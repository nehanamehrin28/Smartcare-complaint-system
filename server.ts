import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  authenticateUser,
  createComplaint,
  createSession,
  deleteSession,
  getComplaintById,
  getPublicCampusStats,
  getUserBySessionToken,
  listComplaints,
  registerStudent,
  trackComplaintByCode,
  updateComplaintByAdmin,
} from './server/db.ts';
import type { ComplaintPriority, ComplaintStatus, User } from './src/types/smartcare.ts';

const COOKIE_NAME = 'smartcare_session';
const VALID_STATUSES: ComplaintStatus[] = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const VALID_PRIORITIES: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

interface AuthenticatedRequest extends Request {
  user?: User;
  sessionToken?: string;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[COOKIE_NAME] || null;
}

function setSessionCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${7 * 24 * 60 * 60}`,
  ];
  if (isProd) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const user = getUserBySessionToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  req.user = user;
  req.sessionToken = token;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges are required for this action.' });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'smartcare-api' });
  });

  app.get('/api/stats/overview', (_req, res) => {
    res.json(getPublicCampusStats());
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, studentId, department } = req.body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid college email address.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const result = registerStudent({
      name,
      email,
      password,
      studentId: typeof studentId === 'string' ? studentId : undefined,
      department: typeof department === 'string' ? department : undefined,
    });

    if (result.error || !result.user) {
      res.status(409).json({ error: result.error || 'Unable to register account.' });
      return;
    }

    const token = createSession(result.user.id);
    setSessionCookie(res, token);
    res.status(201).json({ user: result.user, token });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = authenticateUser(email, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid email address or password.' });
      return;
    }

    const token = createSession(user.id);
    setSessionCookie(res, token);
    res.json({ user, token });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractToken(req);
    if (token) {
      deleteSession(token);
    }
    clearSessionCookie(res);
    res.json({ success: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  app.get('/api/complaints/track/:trackingCode', (req, res) => {
    const code = req.params.trackingCode;
    if (!code || code.trim().length < 3) {
      res.status(400).json({ error: 'Please enter a valid complaint tracking ID.' });
      return;
    }
    const result = trackComplaintByCode(code);
    if (!result) {
      res.status(404).json({ error: `No complaint found matching tracking ID "${code.toUpperCase()}".` });
      return;
    }
    res.json(result);
  });

  app.get('/api/complaints', requireAuth, (req: AuthenticatedRequest, res) => {
    const { status, category, priority, q } = req.query;
    const data = listComplaints({
      user: req.user!,
      status: typeof status === 'string' ? status : undefined,
      category: typeof category === 'string' ? category : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      q: typeof q === 'string' ? q : undefined,
    });
    res.json(data);
  });

  app.get('/api/complaints/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid complaint ID.' });
      return;
    }
    const complaint = getComplaintById(id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }
    if (req.user!.role !== 'admin' && complaint.studentId !== req.user!.id) {
      res.status(403).json({ error: 'You do not have permission to view this complaint.' });
      return;
    }
    res.json(complaint);
  });

  app.post('/api/complaints', requireAuth, (req: AuthenticatedRequest, res) => {
    const { title, category, location, description, submissionDate } = req.body ?? {};
    if (typeof title !== 'string' || title.trim().length < 4) {
      res.status(400).json({ error: 'Please enter a clear complaint title (at least 4 characters).' });
      return;
    }
    if (typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ error: 'Please select a complaint category.' });
      return;
    }
    if (typeof description !== 'string' || description.trim().length < 12) {
      res.status(400).json({ error: 'Please provide a detailed description (at least 12 characters).' });
      return;
    }
    const dateValue =
      typeof submissionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(submissionDate)
        ? submissionDate
        : new Date().toISOString().slice(0, 10);

    const created = createComplaint({
      student: req.user!,
      title,
      category,
      location: typeof location === 'string' ? location : '',
      description,
      submissionDate: dateValue,
    });
    res.status(201).json(created);
  });

  app.patch('/api/complaints/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid complaint ID.' });
      return;
    }

    const { status, priority, assignedDepartment, adminNote } = req.body ?? {};
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid complaint status selected.' });
      return;
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ error: 'Invalid priority level selected.' });
      return;
    }

    const updated = updateComplaintByAdmin({
      id,
      admin: req.user!,
      status,
      priority,
      assignedDepartment: typeof assignedDepartment === 'string' ? assignedDepartment : '',
      adminNote: typeof adminNote === 'string' ? adminNote : '',
    });

    if (!updated) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    res.json(updated);
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build artifacts not found.');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`SmartCare server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SmartCare server:', err);
  process.exit(1);
});
