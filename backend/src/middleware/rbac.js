export function rbac(allowedRoles = []) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || (allowedRoles.length && !allowedRoles.includes(role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
