const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const { session } = req;
    if (session && session.user) {
        res.redirect('/users');
    } else {
        res.render('login', {
            layout: null,
            title: 'Login',
        });
    }
});

const sessionRegenerate = async (req, user) =>
  new Promise(resolve => {
    req.session.regenerate(() => {
      req.session.user = user;
      resolve({
        success: true,
        user,
      });
    });
  });

router.post('/', async(req, res) => {
    const { body: { username, password } } = req;
    if (process.env.login === username && process.env.password === password) {
        await sessionRegenerate(req, {
            username,
            password
        });
        return res.redirect('/users');
    }
    res.render('login', { layout: null, title: 'Human Resource', message: 'Invalid Credentials' });
});

router.get('/logout', (req, res) => {
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(() => {
        res.redirect('/');
    });
});


module.exports = router;