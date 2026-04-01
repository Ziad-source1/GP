// const { setMockUser } = require('../models/middleware');
// const db  = require("../models/db.js");
import db from "../models/db.js";


// helper functions

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

  const sanitizeUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    password: row.password,
    role: row.role,
    is_seller: row.is_seller,
    is_verified: row.is_verified,
    is_blocked: row.is_blocked,
    created_at: row.created_at,
    verification_token: row.verification_token,
  };
};


// END of helper functions


export const loginPage = (req, res) => res.render('auth/login', { title: 'Login — LEVEL UP' });
export const registerPage = (req, res) => res.render('auth/register', { title: 'Create Account — LEVEL UP' });
export const verifyPage = (req, res) => res.render('auth/verify', { title: 'Verify Email — LEVEL UP' });
export const forgotPage = (req, res) => res.render('auth/forgot', { title: 'Reset Password — LEVEL UP' });

export const login = async (req, res) => {
  const { email, password } = req.body;
  const rows = await runQuery("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    if (!rows.length) {
      req.flash('error', 'Invalid email or password.')
      return res.status(401).redirect('/auth/login');
    }

    const userRow = rows[0];

    if (userRow.is_blocked) {
      req.flash(('error', 'Your account has been blocked.'))
      return res.status(403).redirect('/auth/login');
    }

    if (userRow.password !== password) {
      req.flash(('error', 'Invalid email or password.'))
      return res.status(401).redirect('/auth/login');
    }

    // ✅ Save user in session
    req.session.user = sanitizeUser(userRow);
    console.log(req.session.user);
    req.flash('success', 'Welcome back!');
    // return res.status(200).render('buyer/dashboard', {});

    // return res.status(200).render('buyer/dashboard')
  // Mock login — set user based on role param or email
  // if (email === 'admin@levelup.gg') setMockUser(req, 'admin');
  // else if (role === 'seller' || email.includes('ahmed')) setMockUser(req, 'seller');
  // else setMockUser(req, 'buyer');
  // const r = req.session.user.role;
  // if (r === 'admin') return res.redirect('/admin/dashboard');
  // if (r === 'seller') return res.redirect('/seller/dashboard');
  res.redirect('/buyer/dashboard');
};

export const register = async (req, res) => {

  let { username, email, password } = req.body;

  const insertRes = await runQuery(
    "INSERT INTO users (username, email, password, role, is_seller) VALUES (?, ?, ?, ?, ?)",
    [username, email, password, "buyer", false]
  );
  // setMockUser(req, 'buyer');
  req.flash('success', 'Account created! Please verify your email.');
  res.redirect('/auth/verify');
};

export const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

export const demoLogin = (req, res) => {
  const { type } = req.params;
  setMockUser(req, type || 'buyer');
  const r = req.session.user.role;
  if (r === 'admin') return res.redirect('/admin/dashboard');
  if (r === 'seller') return res.redirect('/seller/dashboard');
  res.redirect('/buyer/dashboard');
};
