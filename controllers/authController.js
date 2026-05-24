const db = require('../models/db');
const {getWalletByUserId} = require('../models/data');
// Helper functions - FIXED to use promise properly
const runQuery = async (sql, params = []) => {
  try {
    const [rows] = await db.query(sql, params);
    return rows;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

const sanitizeUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    is_seller: row.is_seller || 0,
    is_verified: row.is_verified || 0,
    is_blocked: row.is_blocked || 0,
    balance: row.balance || 0
  };
};

exports.loginPage = (req, res) => {
  if (req.session.user) {
    const role = req.session.user.role;
    if (role === 'admin') return res.redirect('/admin/dashboard');
    if (role === 'seller') return res.redirect('/seller/dashboard');
    return res.redirect('/buyer/dashboard');
  }
  res.render('auth/login', { 
    title: 'Login — LEVEL UP',
    error: req.flash('error'),
    success: req.flash('success'),
    user: null
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("DBG::email and password",email,password)
    const rows = await runQuery("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    
    if (!rows.length) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    const userRow = rows[0];
    console.log("DBG",userRow);

    if (userRow.is_blocked) {
      req.flash('error', 'Your account has been blocked.');
      return res.redirect('/auth/login');
    }
    console.log("user is not blocked!");
    console.log("db password is ", userRow.password);
    console.log("password is ", password);
    console.log("compare ", userRow.password == password);
    
    if (userRow.password !== password) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    
    console.log("password is correct!");
    
    const wallet = await getWalletByUserId(userRow.id) || { balance: 0 };
    req.session.user = sanitizeUser(userRow);
    req.session.user.balance = wallet.balance;

    req.flash('success', `Welcome back, ${userRow.username}!`);
    
    if (userRow.role === 'admin') return res.redirect('/admin/dashboard');
    if (userRow.role === 'seller' || userRow.is_seller === 1) return res.redirect('/seller/dashboard');
    return res.redirect('/buyer/dashboard');
    
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Login failed.');
    return res.redirect('/auth/login');
  }
};

exports.registerPage = (req, res) => {
  const ref_id = req.query.ref_id;
  console.log("DBG:: register page ref_id",ref_id)
  res.render('auth/register', { 
    title: 'Create Account — LEVEL UP',
    error: req.flash('error'),
    success: req.flash('success'),
    user: null,
    ref_id :ref_id
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, confirm_password } = req.body;
    
    console.log('=== REGISTRATION DEBUG ===');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Password length:', password ? password.length : 0);
    console.log('Confirm password length:', confirm_password ? confirm_password.length : 0);
    console.log('Passwords match:', password === confirm_password);
    
    // Check if passwords match
    if (password !== confirm_password) {
      console.log('❌ FAILED: Passwords do not match');
      req.flash('error', 'Passwords do not match');
      return res.redirect('/auth/register');
    }
    
    // Check password length
    if (!password || password.length < 4) {
      console.log('❌ FAILED: Password too short');
      req.flash('error', 'Password must be at least 4 characters');
      return res.redirect('/auth/register');
    }
    
    // Check if email exists
    console.log('Checking email existence...');
    const existingEmail = await runQuery("SELECT * FROM users WHERE email = ?", [email]);
    console.log('Email exists:', existingEmail.length > 0);
    if (existingEmail.length > 0) {
      console.log('❌ FAILED: Email already exists');
      req.flash('error', 'Email already registered');
      return res.redirect('/auth/register');
    }
    
    // Check if username exists
    console.log('Checking username existence...');
    const existingUsername = await runQuery("SELECT * FROM users WHERE username = ?", [username]);
    console.log('Username exists:', existingUsername.length > 0);
    if (existingUsername.length > 0) {
      console.log('❌ FAILED: Username already exists');
      req.flash('error', 'Username already taken');
      return res.redirect('/auth/register');
    }
    
    // Insert new user
    console.log('Attempting to insert user...');
    const [result] = await db.query(
      "INSERT INTO users (username, email, password, role, is_seller, is_verified, is_blocked) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [username, email, password, "buyer", 0, 0, 0]
    );
    
    console.log('✅ SUCCESS! User created, ID:', result.insertId);
    //updare query to update sellers balance 
    const ref_id = req.query.ref_id;
    console.log("DBG::ref_id",ref_id)
    if(ref_id)
    {
      const wallet = await getWalletByUserId(ref_id);
      const new_balance = Number(wallet.balance) + 50;
      console.log("DBG::new_balance",new_balance);
      await db.query('UPDATE wallet set balance= ? where user_id=?',[new_balance,ref_id])

    }
    req.flash('success', 'Account created! Please login.');
    return res.redirect('/auth/login');
    
  } catch (error) {
    console.error('❌ REGISTER ERROR:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    req.flash('error', 'Registration failed: ' + error.message);
    return res.redirect('/auth/register');
  }
};

// ========== ADD THESE MISSING EXPORTS ==========

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
};

// Forgot Password Page
exports.forgotPage = (req, res) => {
  res.render('auth/forgot', { 
    title: 'Reset Password — LEVEL UP', 
    error: req.flash('error'),
    success: req.flash('success'),
    user: null 
  });
};

// Forgot Password Process (optional)
exports.forgot = async (req, res) => {
  const { email } = req.body;
  console.log('Password reset requested for:', email);
  req.flash('info', 'Password reset feature coming soon');
  res.redirect('/auth/login');
};