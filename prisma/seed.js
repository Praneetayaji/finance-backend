const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  const admin = await prisma.user.upsert({ where: { email: "admin@finance.com" }, update: {},
    create: { name: "Alice Admin", email: "admin@finance.com", password: await bcrypt.hash("admin123", 10), role: "ADMIN" } });
  const analyst = await prisma.user.upsert({ where: { email: "analyst@finance.com" }, update: {},
    create: { name: "Bob Analyst", email: "analyst@finance.com", password: await bcrypt.hash("analyst123", 10), role: "ANALYST" } });
  await prisma.user.upsert({ where: { email: "viewer@finance.com" }, update: {},
    create: { name: "Carol Viewer", email: "viewer@finance.com", password: await bcrypt.hash("viewer123", 10), role: "VIEWER" } });
  const records = [
    { amount: 5000, type: "INCOME", category: "Salary", date: new Date("2024-01-15"), notes: "January salary", userId: admin.id },
    { amount: 1200, type: "EXPENSE", category: "Rent", date: new Date("2024-01-01"), userId: analyst.id },
    { amount: 300.5, type: "EXPENSE", category: "Groceries", date: new Date("2024-01-10"), userId: analyst.id },
    { amount: 800, type: "INCOME", category: "Freelance", date: new Date("2024-01-20"), notes: "Web design project", userId: analyst.id },
    { amount: 150, type: "EXPENSE", category: "Utilities", date: new Date("2024-01-05"), userId: admin.id },
    { amount: 2000, type: "INCOME", category: "Investment", date: new Date("2024-02-01"), userId: admin.id },
    { amount: 450, type: "EXPENSE", category: "Transport", date: new Date("2024-02-10"), userId: analyst.id },
    { amount: 5200, type: "INCOME", category: "Salary", date: new Date("2024-02-15"), userId: analyst.id },
  ];
  for (const r of records) await prisma.financialRecord.create({ data: r });
  console.log("Seed complete!");
  console.log("admin@finance.com / admin123");
  console.log("analyst@finance.com / analyst123");
  console.log("viewer@finance.com / viewer123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
