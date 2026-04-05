const prisma = require("../../config/db");
const { NotFoundError, ForbiddenError } = require("../../utils/errors");

const getAllUsers = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip, take: limit,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        _count: { select: { records: { where: { isDeleted: false } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);
  return { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true,
      _count: { select: { records: { where: { isDeleted: false } } } } },
  });
  if (!user) throw new NotFoundError("User");
  return user;
};

const updateUserRole = async (targetId, newRole, requestingUser) => {
  if (targetId === requestingUser.id) throw new ForbiddenError("You cannot change your own role");
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new NotFoundError("User");
  return prisma.user.update({ where: { id: targetId }, data: { role: newRole },
    select: { id: true, name: true, email: true, role: true } });
};

const updateUserStatus = async (targetId, isActive, requestingUser) => {
  if (targetId === requestingUser.id) throw new ForbiddenError("You cannot deactivate your own account");
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new NotFoundError("User");
  return prisma.user.update({ where: { id: targetId }, data: { isActive },
    select: { id: true, name: true, email: true, isActive: true } });
};

module.exports = { getAllUsers, getUserById, updateUserRole, updateUserStatus };
