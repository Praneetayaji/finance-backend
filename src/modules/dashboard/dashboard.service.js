const prisma = require("../../config/db");

/**
 * Returns total income, total expenses, and net balance.
 * Scoped to a specific user if userId is provided (for ANALYST role).
 */
const getSummary = async (userId = null) => {
  const where = { isDeleted: false };
  if (userId) where.userId = userId;

  const [incomeResult, expenseResult, recentRecords] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { ...where, type: "INCOME" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialRecord.aggregate({
      where: { ...where, type: "EXPENSE" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialRecord.findMany({
      where,
      take: 5,
      orderBy: { date: "desc" },
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        date: true,
        notes: true,
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  const totalIncome = Number(incomeResult._sum.amount || 0);
  const totalExpenses = Number(expenseResult._sum.amount || 0);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    incomeCount: incomeResult._count,
    expenseCount: expenseResult._count,
    recentActivity: recentRecords,
  };
};

/**
 * Returns totals grouped by category.
 */
const getCategoryBreakdown = async (userId = null) => {
  const where = { isDeleted: false };
  if (userId) where.userId = userId;

  const records = await prisma.financialRecord.groupBy({
    by: ["category", "type"],
    where,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: "desc" } },
  });

  // Reshape into { category, income, expense, net }
  const categoryMap = {};
  for (const row of records) {
    if (!categoryMap[row.category]) {
      categoryMap[row.category] = {
        category: row.category,
        income: 0,
        expense: 0,
        count: 0,
      };
    }
    const amount = Number(row._sum.amount || 0);
    if (row.type === "INCOME") categoryMap[row.category].income += amount;
    else categoryMap[row.category].expense += amount;
    categoryMap[row.category].count += row._count;
  }

  return Object.values(categoryMap).map((c) => ({
    ...c,
    net: c.income - c.expense,
  }));
};

/**
 * Returns monthly totals for the last N months.
 */
const getMonthlyTrends = async (userId = null, months = 6) => {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const where = { isDeleted: false, date: { gte: since } };
  if (userId) where.userId = userId;

  const records = await prisma.financialRecord.findMany({
    where,
    select: { amount: true, type: true, date: true },
    orderBy: { date: "asc" },
  });

  // Group by year-month
  const monthMap = {};
  for (const record of records) {
    const key = record.date.toISOString().slice(0, 7); // "YYYY-MM"
    if (!monthMap[key]) {
      monthMap[key] = { month: key, income: 0, expense: 0 };
    }
    const amount = Number(record.amount);
    if (record.type === "INCOME") monthMap[key].income += amount;
    else monthMap[key].expense += amount;
  }

  return Object.values(monthMap).map((m) => ({
    ...m,
    net: m.income - m.expense,
  }));
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends };
