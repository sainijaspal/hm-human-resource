var express = require('express');
var router = express.Router();

const { getUsers, getUserAttendence } = require('../app/DAL/user');

router.get('/', async (req, res) => {
  const { session } = req;
  if (session && session.user) {
    const employees = await getUsers();
    
    res.render('users', {
      title: 'users',
      page_name: 'users',
      employees,
      user: session.user,
    });
  } else {
    res.render('login', {
      layout: null,
      title: 'Human Resource',
      message: 'Session cleared, login again!!'
    });
  }
});

router.get('/attendance', async ({ query: { id } }, res) => {
  const attendence = await getUserAttendence(id);
  res.render('partials/attendance', {
    layout: false,
    attendence,
  });
});


module.exports = router;
