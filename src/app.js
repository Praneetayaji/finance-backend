require("dotenv").config();
const express = require("express");

const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const recordsRoutes = require("./modules/records/records.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const { AppError } = require("./utils/errors");

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

app.use((err, req, res, next) => {
  if (err.code === "P2002") {
    return res.status(409).json({ success: false, error: "A record with this value already exists" });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ success: false, error: "Record not found" });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  console.error("Unexpected error:", err);
  res.status(500).json({ success: false, error: "An unexpected error occurred" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Finance backend running on http://localhost:${PORT}`);
});

module.exports = app;
