const { ForbiddenError } = require("../utils/errors");

// Role hierarchy: ADMIN > ANALYST > VIEWER
const ROLE_LEVELS = {
  VIEWER: 1,
  ANALYST: 2,
  ADMIN: 3,
};

/**
 * Require one of the listed roles to access the route.
 * Usage: requireRole("ADMIN") or requireRole("ANALYST", "ADMIN")
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError());
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `This action requires one of the following roles: ${roles.join(", ")}`
        )
      );
    }

    next();
  };
};

/**
 * Require a minimum role level.
 * Usage: requireMinRole("ANALYST") → allows ANALYST and ADMIN
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError());
    }

    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const requiredLevel = ROLE_LEVELS[minRole] || 0;

    if (userLevel < requiredLevel) {
      return next(
        new ForbiddenError(`This action requires at least ${minRole} role`)
      );
    }

    next();
  };
};

module.exports = { requireRole, requireMinRole };
