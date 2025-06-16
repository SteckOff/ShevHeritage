// server/index.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключаем upload router ПОСЛЕ инициализации app
const uploadRouter = require('./upload');

// ----------------------------
// Конфигурация путей
// ----------------------------
const USERS_FILE    = path.join(__dirname, 'users.json');
const ORDERS_FILE   = path.join(__dirname, 'orders.txt');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ADMIN_PASSWORD = 'MACAN1998';

// ----------------------------
// Конфигурация почты
// ----------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'anatolyt33@gmail.com',
    pass: 'pvwcdwpcdhzrtvry'
  }
});

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ||
  'REDACTED_STRIPE_SECRET';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY ||
  'REDACTED_STRIPE_PUBLISHABLE';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...';

const stripe = Stripe(STRIPE_SECRET_KEY);

// ----------------------------
// Middleware (очень важно — порядок!)
// ----------------------------
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/api', uploadRouter);
app.use(session({
  secret: 'davmad-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));

// ----------------------------
// Stripe Checkout Session API
// ----------------------------
app.post('/api/create-checkout-session', async (req, res) => {
  const { cart, billingDetails } = req.body;
  if (!cart || cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  // Формируем массив товаров для Stripe
  const line_items = cart.map(item => ({
    price_data: {
      currency: 'cad', // или 'usd', если нужно
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100), // Stripe требует цену в центах
    },
    quantity: item.quantity,
  }));

  try {
     const origin = BASE_URL;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout.html?cancel=1`,
      metadata: {
        billingDetails: JSON.stringify(billingDetails),
        cart: JSON.stringify(cart)
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Failed' });
  }
});

// Получение информации о сессии оплаты
app.get('/api/checkout-session', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json(session);
  } catch (err) {
    console.error('Stripe retrieve error:', err);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// Отдаем публичный ключ Stripe на клиент
app.get('/api/stripe-publishable-key', (req, res) => {
  res.json({ publishableKey: STRIPE_PUBLISHABLE_KEY });
});

// Отдаем публичный ключ Stripe на клиент
app.get('/api/stripe-publishable-key', (req, res) => {
  res.json({ publishableKey: STRIPE_PUBLISHABLE_KEY });
});

// ----------------------------
// Вспомогательные функции
// ----------------------------
function loadJSON(file, def) {
  if (!fs.existsSync(file)) return def;
  try { return JSON.parse(fs.readFileSync(file)); }
  catch { return def; }
}
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function loadUsers() {
  return loadJSON(USERS_FILE, {
    pending: [],
    confirmed: [],
    emailChanges: [],
    passwordChanges: []
  });
}
function saveUsers(data) { saveJSON(USERS_FILE, data); }
function loadProducts() { return loadJSON(PRODUCTS_FILE, []); }
function saveProducts(list) { saveJSON(PRODUCTS_FILE, list); }
function appendOrder(order) {
  const line = `${new Date().toISOString()} - ${JSON.stringify(order)}\n`;
  fs.appendFileSync(ORDERS_FILE, line);
}
function ensureAdmin(req, res, next) {
  if (req.session.admin) return next();
  res.status(403).json({ error: 'Forbidden' });
}

// ----------------------------
// Роуты API (регистрация, логин, продукты, ордеры, админ)
// ----------------------------
app.post('/api/register', async (req, res) => {
  const { email, firstName, lastName } = req.body;
  if (!email || !firstName || !lastName) return res.status(400).json({ error: 'Missing fields' });
  const data = loadUsers();
  if (data.confirmed.some(u => u.email === email) || data.pending.some(u => u.email === email))
    return res.status(409).json({ error: 'Email already used' });
  const code = Math.floor(100000 + Math.random()*900000).toString();
  data.pending.push({ email, firstName, lastName, code, created: Date.now() });
  saveUsers(data);
  try {
    await transporter.sendMail({
      from: transporter.options.auth.user,
      to: email,
      subject: 'Verify Your Email to Complete Registration',
      text: `Hello ${firstName} ${lastName},\n\nThank you for signing up at ShevHeritage!\n\nTo complete your registration and activate your account, please verify your email address using the code below:\n\nVerification Code: ${code}\n\nIf you did not create an account, you can disregard this email — no action will be taken.\n\nWith appreciation,\nShevHeritage Team`,
      html: `
        <p style="font-family:sans-serif; font-size:15px; line-height:1.6;">
          Hello <strong>${firstName} ${lastName}</strong>,<br><br>
          Thank you for signing up at <b>ShevHeritage</b>!<br><br>
          To complete your registration, please verify your email address by entering the following code:<br><br>
          <div style="font-size:24px; font-weight:bold; color:#28a745;">${code}</div><br>
          If you didn’t initiate this registration, feel free to ignore this email — no changes will be made.<br><br>
          Best wishes,<br>
          — <strong>ShevHeritage Team</strong>
        </p>
      `
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Email failed' });
  }
});

app.post('/api/verify', async (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password) return res.status(400).json({ error: 'Missing fields' });
  const data = loadUsers();
  const idx = data.pending.findIndex(u => u.email === email && u.code === code);
  if (idx === -1) return res.status(401).json({ error: 'Invalid code' });
  const user = data.pending.splice(idx, 1)[0];
  const hash = await bcrypt.hash(password, 10);
  data.confirmed.push({ email, firstName: user.firstName, lastName: user.lastName, hash });
  saveUsers(data);
  req.session.user = email;
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const data = loadUsers();
  const user = data.confirmed.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.hash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.user = email;
  res.json({ ok: true });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (req.session.user) return res.json({ email: req.session.user });
  res.status(401).json({ error: 'Not authenticated' });
});

// === Если старый ордер-роут ещё нужен для другого (не Stripe) — оставь
app.post('/order', (req, res) => {
  try { appendOrder(req.body); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: 'Order failed' }); }
});

app.get('/api/orders', ensureAdmin, (req, res) => {
  if (!fs.existsSync(ORDERS_FILE)) return res.json([]);
  const lines = fs.readFileSync(ORDERS_FILE, 'utf-8').split('\n').filter(Boolean);
  const parsed = lines.map(l => {
    const [date, json] = l.split(' - ');
    return { date, ...JSON.parse(json) };
  });
  res.json(parsed);
});

app.get('/api/products', (req, res) => {
  res.json(loadProducts());
});

app.post('/api/products', ensureAdmin, (req, res) => {
  const list = loadProducts();
  const newItem = { id: Date.now().toString(), ...req.body };
  list.push(newItem);
  saveProducts(list);
  res.json(newItem);
});

app.put('/api/products/:id', ensureAdmin, (req, res) => {
  const list = loadProducts();
  const idx = list.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  list[idx] = { ...list[idx], ...req.body };
  saveProducts(list);
  res.json(list[idx]);
});

app.delete('/api/products/:id', ensureAdmin, (req, res) => {
  const list = loadProducts().filter(p => p.id !== req.params.id);
  saveProducts(list);
  res.json({ ok: true });
});

app.post('/api/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid password' });
});

app.post('/api/me/update', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const users = loadUsers();
  const user = users.confirmed.find(u => u.email === req.session.user);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.body.fullName) user.fullName = req.body.fullName;
  if (req.body.address) user.address = req.body.address;
  if (req.body.password && req.body.password.length > 4) {
    user.hash = await bcrypt.hash(req.body.password, 10);
  }

  saveUsers(users);
  res.json({ ok: true });
});

// ----------------------------
// Изменение личных данных (имя, фамилия) с проверкой пароля
// ----------------------------
app.post('/api/me/update-info', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const { firstName, lastName, password } = req.body;
  if (!password) return res.status(400).json({ error: 'Missing password' });

  const data = loadUsers();
  const user = data.confirmed.find(u => u.email === req.session.user);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const match = await bcrypt.compare(password, user.hash);
  if (!match) return res.status(401).json({ error: 'Invalid password' });

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;

  saveUsers(data);
  res.json({ ok: true });
});

// ----------------------------
// Запрос на изменение email
// ----------------------------
app.post('/api/me/email-change-request', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ error: 'Missing new email' });

  const data = loadUsers();
  if (data.confirmed.some(u => u.email === newEmail))
    return res.status(409).json({ error: 'Email already used' });

  const code = Math.floor(100000 + Math.random()*900000).toString();

  const user = data.confirmed.find(u => u.email === req.session.user) || {};
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  
  data.emailChanges.push({ email: req.session.user, newEmail, code, step: 'old' });
  saveUsers(data);

  transporter.sendMail({
    from: transporter.options.auth.user,
    to: req.session.user,
    subject: 'Request to Change Your Email Address',
    text: `Dear ${firstName} ${lastName},\n\nWe received a request to change the email address associated with your ShevHeritage account.\n\nIf you made this request, please use the verification code below to confirm the change:\n\nVerification Code: ${code}\n\nIf you did not request this change, you can safely ignore this message. No further action is needed.\n\nBest regards,\nShevHeritage Support Team`,
    html: `
      <p style="font-family:sans-serif; font-size:15px; line-height:1.6;">
        Dear <strong>${firstName} ${lastName}</strong>,<br><br>
        We received a request to change the email address associated with your <b>ShevHeritage</b> account.<br><br>
        If you made this request, please enter the following verification code to confirm the change:<br><br>
        <div style="font-size:24px; font-weight:bold; color:#007bff;">${code}</div><br>
        If this wasn’t you, no worries — you can simply ignore this message.<br><br>
        Stay safe,<br>
        — <strong>ShevHeritage Support Team</strong>
      </p>
    `

  }).catch(err => console.error('Email error', err));

  res.json({ ok: true });
});

// Проверка кода со старого email и отправка нового кода на новый email
app.post('/api/me/email-change-verify-old', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const { code } = req.body;
  const data = loadUsers();
  const reqIdx = data.emailChanges.findIndex(r => r.email === req.session.user && r.code === code && r.step === 'old');
  if (reqIdx === -1) return res.status(400).json({ error: 'Invalid code' });

  const request = data.emailChanges[reqIdx];
  request.code = Math.floor(100000 + Math.random()*900000).toString();
  request.step = 'new';
  saveUsers(data);

  transporter.sendMail({
    from: transporter.options.auth.user,
    to: request.newEmail,
    subject: 'Verify new email',
    text: `Enter this code to confirm your new email: ${request.code}`
  }).catch(err => console.error('Email error', err));

  res.json({ ok: true });
});

// Подтверждение нового email и обновление аккаунта
app.post('/api/me/email-change-verify-new', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const { code } = req.body;
  const data = loadUsers();
  const idx = data.emailChanges.findIndex(r => r.email === req.session.user && r.code === code && r.step === 'new');
  if (idx === -1) return res.status(400).json({ error: 'Invalid code' });

  const { newEmail } = data.emailChanges.splice(idx, 1)[0];
  const user = data.confirmed.find(u => u.email === req.session.user);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.email = newEmail;
  req.session.user = newEmail;

  saveUsers(data);
  res.json({ ok: true, email: newEmail });
});

// ----------------------------
// Смена пароля с подтверждением по email
// ----------------------------
app.post('/api/me/password-change-request', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 5) return res.status(400).json({ error: 'Invalid password' });

  const hash = await bcrypt.hash(newPassword, 10);
  const code = Math.floor(100000 + Math.random()*900000).toString();

  const data = loadUsers();
  data.passwordChanges.push({ email: req.session.user, hash, code });
  saveUsers(data);

  transporter.sendMail({
    from: transporter.options.auth.user,
    to: req.session.user,
    subject: 'Confirm password change',
    text: `Enter this code to confirm your password change: ${code}`
  }).catch(err => console.error('Email error', err));

  res.json({ ok: true });
});

app.post('/api/me/password-change-confirm', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const { code } = req.body;

  const data = loadUsers();
  const idx = data.passwordChanges.findIndex(r => r.email === req.session.user && r.code === code);
  if (idx === -1) return res.status(400).json({ error: 'Invalid code' });

  const { hash } = data.passwordChanges.splice(idx, 1)[0];
  const user = data.confirmed.find(u => u.email === req.session.user);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.hash = hash;
  saveUsers(data);
  res.json({ ok: true });
});
// Stripe Webhook endpoint
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), (req, res) => {
  const endpointSecret = STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Обработка события оплаты
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Тут ты можешь получить все нужные данные для заказа:
    // session.metadata, session.id, session.amount_total и т.д.
    // Пример: записываем заказ в orders.txt

    const order = {
      sessionId: session.id,
      email: session.customer_details?.email,
      billingDetails: session.metadata ? JSON.parse(session.metadata.billingDetails) : {},
      cart: session.metadata ? JSON.parse(session.metadata.cart) : [],
      status: 'confirmed',
      paid_at: new Date().toISOString()
    };
    appendOrder(order); // Используй свою функцию!
    console.log('Order confirmed & saved:', order);
  }

  res.json({ received: true });
});

// ----------------------------
// Запуск сервера
// ----------------------------
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
