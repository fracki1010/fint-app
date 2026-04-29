import { Router } from "express";

import { authenticate } from "../middlewares/authenticate";
import { authorizeAny } from "../middlewares/authorizeAny";
import {
  createSupplierAccountEntry,
  getSupplierAccount,
  getSupplierStatement,
} from "../services/supplierAccount.service";

const router = Router();

router.get(
  "/:id/account",
  authenticate,
  authorizeAny({
    roles: ["admin", "accounting_manager"],
    permissions: [
      "supplier-account:*",
      "supplier-account:read",
      "supplier-account:manage",
    ],
  }),
  async (req, res) => res.json(await getSupplierAccount(req.params.id)),
);

router.post(
  "/:id/account/payment",
  authenticate,
  authorizeAny({
    roles: ["admin", "accounting_manager"],
    permissions: [
      "supplier-account:*",
      "supplier-account:manage",
      "supplier-account:update",
    ],
  }),
  async (req, res) => {
    const created = await createSupplierAccountEntry({
      supplierId: req.params.id,
      type: "PAYMENT",
      ...req.body,
      createdBy: req.authUser?._id,
    });

    return res.status(201).json(created);
  },
);

router.post(
  "/:id/account/entry",
  authenticate,
  authorizeAny({
    roles: ["admin", "accounting_manager"],
    permissions: [
      "supplier-account:*",
      "supplier-account:manage",
      "supplier-account:update",
    ],
  }),
  async (req, res) => {
    const created = await createSupplierAccountEntry({
      supplierId: req.params.id,
      ...req.body,
      createdBy: req.authUser?._id,
    });

    return res.status(201).json(created);
  },
);

router.get(
  "/:id/account/statement",
  authenticate,
  authorizeAny({
    roles: ["admin", "accounting_manager"],
    permissions: [
      "supplier-account:*",
      "supplier-account:read",
      "supplier-account:manage",
    ],
  }),
  async (req, res) => {
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;

    return res.json(await getSupplierStatement(req.params.id, from, to));
  },
);

export default router;
