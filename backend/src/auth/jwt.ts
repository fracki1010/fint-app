import jwt from "jsonwebtoken";

import { env } from "../config/env";
import type { AuthUser } from "../types/auth";

export function signAuthToken(user: AuthUser) {
  return jwt.sign({ user }, env.jwtSecret, { expiresIn: "8h" });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as { user?: AuthUser };
}
