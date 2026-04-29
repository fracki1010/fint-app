import { Router } from "express";

import { authenticate } from "../middlewares/authenticate";
import { authorizeAny } from "../middlewares/authorizeAny";
import {
  cancelPurchase,
  confirmPurchase,
  createPurchase,
  getPurchaseById,
  listPurchases,
  receivePurchase,
} from "../services/purchases.service";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:read", "purchases:manage"],
  }),
  async (_req, res) => res.json(await listPurchases()),
);

router.post(
  "/",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:manage", "purchases:update"],
  }),
  async (req, res) => {
    const created = await createPurchase({ ...req.body, createdBy: req.authUser?._id });

    return res.status(201).json(created);
  },
);

router.get(
  "/:id",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:read", "purchases:manage"],
  }),
  async (req, res) => {
    try {
      const purchase = await getPurchaseById(req.params.id);

      return res.json(purchase);
    } catch (error) {
      const code = (error as Error).message;

      if (code === "PURCHASE_NOT_FOUND") return res.status(404).json({ message: code });

      return res.status(500).json({ message: "INTERNAL_ERROR" });
    }
  },
);

router.post(
  "/:id/confirm",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:manage", "purchases:update"],
  }),
  async (req, res) => {
    try {
      const purchase = await confirmPurchase(req.params.id);

      return res.json(purchase);
    } catch (error) {
      const code = (error as Error).message;

      if (code === "PURCHASE_NOT_FOUND") return res.status(404).json({ message: code });
      if (code === "INVALID_STATUS_TRANSITION") return res.status(409).json({ message: code });

      return res.status(500).json({ message: "INTERNAL_ERROR" });
    }
  },
);

router.post(
  "/:id/receive",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:manage", "purchases:update"],
  }),
  async (req, res) => {
    try {
      const purchase = await receivePurchase(req.params.id, req.authUser?._id);

      return res.json(purchase);
    } catch (error) {
      const code = (error as Error).message;

      if (code === "PURCHASE_NOT_FOUND") return res.status(404).json({ message: code });
      if (code === "INVALID_STATUS_TRANSITION") return res.status(409).json({ message: code });
      if (code === "SUPPLY_NOT_FOUND" || code === "INVALID_QUANTITY" || code === "NEGATIVE_STOCK") {
        return res.status(400).json({ message: code });
      }

      return res.status(500).json({ message: "INTERNAL_ERROR" });
    }
  },
);

router.post(
  "/:id/cancel",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:manage", "purchases:update"],
  }),
  async (req, res) => {
    try {
      const purchase = await cancelPurchase(req.params.id);

      return res.json(purchase);
    } catch (error) {
      const code = (error as Error).message;

      if (code === "PURCHASE_NOT_FOUND") return res.status(404).json({ message: code });
      if (code === "INVALID_STATUS_TRANSITION") return res.status(409).json({ message: code });

      return res.status(500).json({ message: "INTERNAL_ERROR" });
    }
  },
);

export default router;
