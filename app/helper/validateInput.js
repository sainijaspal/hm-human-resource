const { validationResult } = require('express-validator/check');

const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(402).json({
      errors: errors.mapped(),
    });
  }
  return next();
};
module.exports = { validateInput };
