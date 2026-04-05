const prisma = require("../../config/db");
const { NotFoundError, ForbiddenError } = require("../../utils/errors");

/**
 * Build a Prisma where clause from query filters.
 * Admins and Analysts see all records; ownership is enforced at the action level.
 */
const buildFilters = ({ type, category, startDate, endDate, userId }) => {
  const where = { isDeleted: false };

  if (type) where.type = type;
  if (category) where.category = { contains: category, mode: "insensitive" };
  if (userId) where.userId = userId;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  return where;
};

const getRecords = async (filters, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = buildFilters(filters);

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    records,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const getRecordById = async (id, requestingUser) => {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!record) throw new NotFoundError("Record");

  // Analysts can only view their own records
  if (requestingUser.role === "ANALYST" && record.userId !== requestingUser.id) {
    throw new ForbiddenError("You can only view your own records");
  }

  return record;
};

const createRecord = async (data, userId) => {
  return prisma.financialRecord.create({
    data: { ...data, userId, date: new Date(data.date) },
    include: { user: { select: { id: true, name: true } } },
  });
};

const updateRecord = async (id, data, requestingUser) => {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
  });

  if (!record) throw new NotFoundError("Record");

  // Analysts can only update their own records
  if (requestingUser.role === "ANALYST" && record.userId !== requestingUser.id) {
    throw new ForbiddenError("You can only update your own records");
  }

  const updateData = { ...data };
  if (data.date) updateData.date = new Date(data.date);

  return prisma.financialRecord.update({
    where: { id },
    data: updateData,
    include: { user: { select: { id: true, name: true } } },
  });
};

const deleteRecord = async (id) => {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
  });

  if (!record) throw new NotFoundError("Record");

  // Soft delete
  return prisma.financialRecord.update({
    where: { id },
    data: { isDeleted: true },
  });
};

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord };
