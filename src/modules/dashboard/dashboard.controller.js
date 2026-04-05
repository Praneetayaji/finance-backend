const dashboardService = require("./dashboard.service");

const getScopeUserId = (user) => user.role === "ANALYST" ? user.id : null;

const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(getScopeUserId(req.user));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const data = await dashboardService.getCategoryBreakdown(getScopeUserId(req.user));
    res.json({ success: true, data: { categories: data } });
  } catch (err) { next(err); }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const months = Math.min(parseInt(req.query.months) || 6, 24);
    const data = await dashboardService.getMonthlyTrends(getScopeUserId(req.user), months);
    res.json({ success: true, data: { trends: data } });
  } catch (err) { next(err); }
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends };
