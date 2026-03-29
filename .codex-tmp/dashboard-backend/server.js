const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./src/config/db"); // 👈 1. Importamos la conexión
// const { initializeWhatsApp } = require("./src/services/whatsappService"); // Comentado para evitar levantar WhatsApp al iniciar el servidor

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// 👈 2. EJECUTAMOS LA CONEXIÓN A LA BASE DE DATOS AQUÍ
connectDB();

// Inicializar Bot de WhatsApp
// initializeWhatsApp();

// Rutas de la API
app.use("/api/clients", require("./src/routes/clientRoutes"));
app.use("/api/products", require("./src/routes/productRoutes"));
app.use("/api/orders", require("./src/routes/orderRoutes"));
app.use("/api/settings", require("./src/routes/settingRoutes"));
app.use("/api/stock-movements", require("./src/routes/stockMovementRoutes"));
app.use("/api/dashboard", require("./src/routes/dashboardRoutes"));

// Rutas básicas
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Servidor y Bot funcionando" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
