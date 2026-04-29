import { Router } from "express";

import { signAuthToken } from "../auth/jwt";
import { authenticate } from "../middlewares/authenticate";
import type { AuthUser } from "../types/auth";

const router = Router();

router.post("/login", (_req, res) => {
  const user: AuthUser = {
    _id: "u_123",
    fullName: "Ana Perez",
    email: "ana@empresa.com",
    isActive: true,
    roles: ["purchasing_manager"],
    permissions: ["purchases:manage", "supplies:read"],
  };

  const token = signAuthToken(user);

  return res.json({ token, user });
});

router.get("/me", authenticate, (req, res) => {
  return res.json({ user: req.authUser });
});

export default router;
