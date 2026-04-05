const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const { UnauthorizedError } = require("../utils/errors");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) throw new UnauthorizedError("No token provided");
    const token = authHeader.split(" ")[1];
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
    catch { throw new UnauthorizedError("Invalid or expired token"); }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!user) throw new UnauthorizedError("User no longer exists");
    if (!user.isActive) throw new UnauthorizedError("Your account has been deactivated");
    req.user = user;
    next();
  } catch (err) { next(err); }
};

module.exports = { authenticate };
