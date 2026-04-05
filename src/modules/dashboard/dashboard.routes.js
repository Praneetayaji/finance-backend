const express = require("express");
const { authenticate } = require("../../middleware/auth");
const { getSummary, getCategoryBreakdown, getMonthlyTrends } = require("./dashboard.controller");
const router = express.Router();
router.use(authenticate);
router.get("/summary", getSummary);
router.get("/categories", getCategoryBreakdown);
router.get("/trends", getMonthlyTrends);
module.exports = router;
