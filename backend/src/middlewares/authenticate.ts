import type { NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "../auth/jwt";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const decoded = verifyAuthToken(token);

    if (!decoded?.user) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.authUser = decoded.user;

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
