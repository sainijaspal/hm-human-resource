const express = require('express');
const hbs = require('hbs');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const compression = require('compression');
const RedisStore = require('connect-redis')(session);
const dotenv = require('dotenv');

const app = express();

dotenv.load();

const redisUrl = process.env.REDIS_URL;
const {
  enums: { environment },
} = require('./app/helper/constants');

// eslint-disable-next-line no-undef
restrict = (req, res, next) => {
  if (req.session.user && typeof req.session.user !== 'undefined') {
    return next();
  }
  req.session.error = 'Access denied!';
  if (!req.xhr) {
    req.session.return_url = req.originalUrl;
  }
  return res.redirect('/');
};

global.express = express;
global.app = app;
global.appPath = __dirname;

if (redisUrl === undefined) {
  app.use(
    session({
      secret: 'max',
      saveUninitialized: false,
      resave: false,
      cookie: {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60000),
        maxAge: 30 * 24 * 60 * 60000,
      },
    }),
  );
} else {
  app.use(
    session({
      store: new RedisStore({ url: redisUrl }),
      secret: 'max',
      saveUninitialized: false,
      resave: false,
      cookie: {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60000),
        maxAge: 30 * 24 * 60 * 60000,
      },
    }),
  );
}

hbs.registerPartials(`${__dirname}/app/views/partials`);

// view engine setup
app.set('views', path.join(__dirname, './app/views'));
app.set('view engine', 'hbs');

require('./app/helper/customHelpers');

app.options('*', cors());
app.use(cors());

app.use(logger('dev'));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(cookieParser());

/*
Create javascript and css files bundle to load all files in single request.
only uncomment when you add new third party css or script in appripriate bundle.
It will create bundle in /public/bin/bundle directory.
*/
// let BundleUp = require('bundle-up2')
// ,   assets = require('./assets');
// BundleUp(app, assets, {
//   staticRoot: __dirname + '/public/',
//   staticUrlRoot:'',
//   bundle:true,
//   minifyCss: true,
//   minifyJs: true,
//   complete: console.log.bind(console, "Bundle-up: static files are minified/ready")
// });

app.use(compression());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes'));

app.use((err, req, res) => {
  if (err && err.message) {
    res.locals.message = err.message;
  }
  if (err.status === 500 && !req.xhr) {
    res.render('500', { layout: null });
  } else if (err.status === 401 && !req.xhr) {
    res.render('401', { layout: null });
  } else if (err.status === 404 && !req.xhr) {
    res.render('404', { layout: null, url: req.url });
  } else {
    if (req.xhr) {
      res.status(err.http_code || 500).send('error');
    }
  }
});

module.exports = app;
