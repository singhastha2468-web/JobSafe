require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { requireAuth } = require('./auth');
const { scanPosting } = require('./scanner');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Set JWT_SECRET in backend/.env to a random value of at least 32 characters.');
  process.exit(1);
}
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5500' }));
app.use(express.json({ limit: '30kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'JobSafe API' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !/^\S+@\S+\.\S+$/.test(email) || !password || password.length < 8)
      return res.status(400).json({ error: 'Enter a name, valid email and password of at least 8 characters.' });
    const normalizedEmail = email.trim().toLowerCase();
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)').run(name.trim(), normalizedEmail, hash);
    const token = jwt.sign({ id: result.lastInsertRowid, name: name.trim(), email: normalizedEmail }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, name: name.trim(), email: normalizedEmail } });
  } catch (error) {
    if (String(error.code).includes('SQLITE_CONSTRAINT')) return res.status(409).json({ error: 'An account with this email already exists.' });
    res.status(500).json({ error: 'Could not create account.' });
  }
});
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').trim().toLowerCase());
  if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash))) return res.status(401).json({ error: 'Invalid email or password.' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/scans', requireAuth, (req, res) => {
  try {
    const { text, company = '', contact = '' } = req.body || {};
    const result = scanPosting(text, contact);
    const saved = db.prepare('INSERT INTO scans (user_id,company,score,level,flags_json) VALUES (?,?,?,?,?)')
      .run(req.user.id, String(company).slice(0,160), result.score, result.level, JSON.stringify(result.flags));
    res.status(201).json({ id: saved.lastInsertRowid, ...result });
  } catch (error) { res.status(400).json({ error: error.message || 'Could not scan posting.' }); }
});
app.get('/api/scans', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id,company,score,level,flags_json,created_at FROM scans WHERE user_id=? ORDER BY id DESC LIMIT 50').all(req.user.id);
  res.json(rows.map(row => ({ ...row, flags: JSON.parse(row.flags_json), flags_json: undefined })));
});
app.post('/api/reports', requireAuth, (req, res) => {
  const { company, reason, details } = req.body || {};
  if (!company || !reason || !details) return res.status(400).json({ error: 'Company, reason and details are required.' });
  const result = db.prepare('INSERT INTO reports (user_id,company,reason,details) VALUES (?,?,?,?)')
    .run(req.user.id, String(company).slice(0,160), String(reason).slice(0,120), String(details).slice(0,2000));
  res.status(201).json({ id: result.lastInsertRowid, status: 'unverified', message: 'Report submitted for review.' });
});
app.get('/api/reports', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id,company,reason,details,status,created_at FROM reports WHERE user_id=? ORDER BY id DESC LIMIT 50').all(req.user.id);
  res.json(rows);
});
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Unexpected server error.' }); });
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`JobSafe API running at http://localhost:${port}`));
