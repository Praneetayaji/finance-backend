const { z } = require("zod");
const usersService = require("./users.service");
const { ValidationError } = require("../../utils/errors");

const updateRoleSchema = z.object({ role: z.enum(["VIEWER", "ANALYST", "ADMIN"]) });
const updateStatusSchema = z.object({ isActive: z.boolean() });

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const data = await usersService.getAllUsers({ page, limit });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const result = updateRoleSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    const user = await usersService.updateUserRole(req.params.id, result.data.role, req.user);
    res.json({ success: true, message: "Role updated", data: { user } });
  } catch (err) { next(err); }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const result = updateStatusSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    const user = await usersService.updateUserStatus(req.params.id, result.data.isActive, req.user);
    res.json({ success: true, message: "Status updated", data: { user } });
  } catch (err) { next(err); }
};

module.exports = { getAllUsers, getUserById, updateUserRole, updateUserStatus };
