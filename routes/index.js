const router = express.Router(); // eslint-disable-line no-undef
const { check } = require('express-validator/check');

const { permission } = require('../app/middlewares/permission');
const { validateInput } = require('./../app/helper/validateInput');
const { exceptionHandler } = require('../app/helper/common');


const user = require('./user');
const login = require('./login');

router.use('/users', user);
router.use('/', login);
/* eslint-enable no-undef */


module.exports = router;
