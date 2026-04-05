const { z } = require("zod");
const authService = require("./auth.service");
const { ValidationError } = require("../../utils/errors");

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const register = async (req, res, next) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    const data = await authService.register(result.data);
    res.status(201).json({ success: true, message: "Account created successfully", data });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    const data = await authService.login(result.data);
    res.status(200).json({ success: true, message: "Login successful", data });
  } catch (err) { next(err); }
};

const me = (req, res) => res.json({ success: true, data: { user: req.user } });

module.exports = { register, login, me };
