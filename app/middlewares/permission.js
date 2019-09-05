// middleware for doing role-based permissions
const permission = allowed => {
  const is_allowed = role => allowed.indexOf(role) > -1; // role.indexOf(allowed, role) > -1;

  // return a middleware
  return (req, res, next) => {
    if (req.session.user && is_allowed(req.session.user.role)) {
      next();
    } else {
      res.redirect('/');
    }
  };
};

module.exports = { permission };
