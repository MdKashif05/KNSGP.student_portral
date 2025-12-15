import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: 'admin' | 'student';
    adminRole?: 'admin' | 'super_admin';
    username: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized: Login required" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.userRole !== 'admin') {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.userRole !== 'admin' || req.session.adminRole !== 'super_admin') {
    return res.status(403).json({ message: "Forbidden: Super Admin access required" });
  }
  next();
}

export function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.userRole !== 'student') {
    return res.status(403).json({ message: "Forbidden: Student access required" });
  }
  next();
}
