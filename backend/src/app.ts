import express from "express";

import authRoutes from "./routes/auth.routes";
import purchasesRoutes from "./routes/purchases.routes";
import supplierAccountRoutes from "./routes/supplier-account.routes";
import suppliesRoutes from "./routes/supplies.routes";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/supplies", suppliesRoutes);
app.use("/api/purchases", purchasesRoutes);
app.use("/api/suppliers", supplierAccountRoutes);

export default app;
