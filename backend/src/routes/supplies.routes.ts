import { Router } from "express";

import { authenticate } from "../middlewares/authenticate";
import { authorizeAny } from "../middlewares/authorizeAny";
import {
  createSupply,
  createSupplyMovement,
  getSupplyMovements,
  listSupplies,
} from "../services/supplies.service";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeAny({
    roles: ["admin", "inventory_manager"],
    permissions: ["supplies:*", "supplies:read", "supplies:manage"],
  }),
  async (_req, res) => res.json(await listSupplies()),
);

router.post(
  "/",
  authenticate,
  authorizeAny({
    roles: ["admin", "inventory_manager"],
    permissions: ["supplies:*", "supplies:manage", "supplies:update"],
  }),
  async (req, res) => {
    const created = await createSupply(req.body);

    return res.status(201).json(created);
  },
);

router.get(
  "/:id/movements",
  authenticate,
  authorizeAny({
    roles: ["admin", "inventory_manager"],
    permissions: ["supplies:*", "supplies:read", "supplies:manage"],
  }),
  async (req, res) => {
    return res.json(await getSupplyMovements(req.params.id));
  },
);

router.post(
  "/:id/movements",
  authenticate,
  authorizeAny({
    roles: ["admin", "inventory_manager"],
    permissions: ["supplies:*", "supplies:manage", "supplies:update"],
  }),
  async (req, res) => {
    try {
      const created = await createSupplyMovement({
        supplyItemId: req.params.id,
        ...req.body,
        createdBy: req.authUser?._id,
      });

      return res.status(201).json(created);
    } catch (error) {
      const code = (error as Error).message;

      if (code === "SUPPLY_NOT_FOUND") {
        return res.status(404).json({ message: code });
      }
      if (code === "INVALID_QUANTITY" || code === "NEGATIVE_STOCK") {
        return res.status(400).json({ message: code });
      }

      return res.status(500).json({ message: "INTERNAL_ERROR" });
    }
  },
);

export default router;
