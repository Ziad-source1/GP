const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const morgan = require('morgan');
const path = require('path');
const { fundWallet ,updateBalance} = require('./models/middleware');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/products', express.static(path.join(__dirname, 'public/uploads/products')));
app.use('/uploads/verification', express.static(path.join(__dirname, 'public/uploads/verification')));
app.use(express.static(path.join(__dirname, 'public/uploads/products')));
// Session
app.use(session({
  secret: 'levelup_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));



app.use(flash());

// Global locals
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentPath = req.path;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use(updateBalance);
app.use('/marketplace', require('./routes/marketplace'));
app.use('/buyer', require('./routes/buyer'));
app.use('/seller', require('./routes/seller'));
app.use('/admin', require('./routes/admin'));
app.use('/pages', require('./routes/pages'));
app.post('/fund-wallet', fundWallet);

// 404
app.use((req, res) => {
  res.status(404).render('pages/404', { title: '404 - Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/500', { title: 'Server Error' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🎮 LEVEL UP running on http://localhost:${PORT}`));
