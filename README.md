# 🛍 ShevHeritage — Multi-page E-commerce Platform

**Full-featured e-commerce site with admin dashboard, user accounts, blog, shopping cart, and Stripe checkout — built end-to-end on a vanilla JS frontend and Node.js backend.**

![Status](https://img.shields.io/badge/status-portfolio--showcase-success)
![Stack](https://img.shields.io/badge/stack-Vanilla%20JS%20%2B%20Node-blue)
![Stripe](https://img.shields.io/badge/payments-Stripe-635BFF)

---

## ✨ Features

- 🏠 **Multi-page storefront** — home, shop grid, product details, blog, contact
- 🛒 **Cart & checkout flow** — add to cart, review, payment, success page
- 🔐 **User accounts** — registration, login, personal info, account management
- 👨‍💼 **Admin dashboard** — product CRUD, image uploads, order overview
- 💳 **Stripe payment integration** (test mode) — secure server-side checkout
- 📝 **Blog** with detail pages
- 📱 **Responsive design** across all pages

## 🏗 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Vanilla JavaScript · HTML5 · SCSS · Less · CSS3 |
| **Backend** | Node.js · Express |
| **Payments** | Stripe |
| **Storage** | JSON-based persistence (products.json, users.json, orders.txt) |
| **Tooling** | npm · custom build scripts |

## 🚀 Quick Start

```bash
cd ~/Code/ShevHeritage

############################################
# 1. Python-скрипт убирает hardcoded fallback
############################################
cat > /tmp/fix_stripe.py << 'PYEOF'
import re
with open('server/index.js', 'r') as f:
    content = f.read()

# secret
content = re.sub(
    r"process\.env\.STRIPE_SECRET_KEY\s*\|\|\s*\n?\s*['\"]sk_test_[A-Za-z0-9]+['\"]",
    'process.env.STRIPE_SECRET_KEY',
    content
)
# publishable
content = re.sub(
    r"process\.env\.STRIPE_PUBLISHABLE_KEY\s*\|\|\s*\n?\s*['\"]pk_test_[A-Za-z0-9]+['\"]",
    'process.env.STRIPE_PUBLISHABLE_KEY',
    content
)

with open('server/index.js', 'w') as f:
    f.write(content)
print('✅ server/index.js: hardcoded fallbacks removed')
PYEOF
python3 /tmp/fix_stripe.py

echo ""
echo "=== ПРОВЕРКА: ключей в файле быть не должно ==="
grep -n "sk_test_\|pk_test_" server/index.js && echo "❌ ОСТАЛОСЬ — стоп" || echo "✅ В файле чисто"

echo ""
echo "=== Контекст вокруг STRIPE_ ==="
grep -B 1 -A 1 "STRIPE_" server/index.js | head -25

############################################
# 2. .gitignore + .env.example
############################################
grep -qxF ".env" .gitignore 2>/dev/null || echo ".env" >> .gitignore

cat > .env.example << 'EOF'
# Stripe — get your test keys at https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_PUBLISHABLE_KEY=pk_test_replace_me

# Server
PORT=3000
EOF

############################################
# 3. README — заменяем на нормальный
############################################
cat > README.md << 'README_EOF'
# 🛍 ShevHeritage — Multi-page E-commerce Platform

**Full-featured e-commerce site with admin dashboard, user accounts, blog, shopping cart, and Stripe checkout — built end-to-end on a vanilla JS frontend and Node.js backend.**

![Status](https://img.shields.io/badge/status-portfolio--showcase-success)
![Stack](https://img.shields.io/badge/stack-Vanilla%20JS%20%2B%20Node-blue)
![Stripe](https://img.shields.io/badge/payments-Stripe-635BFF)

---

## ✨ Features

- 🏠 **Multi-page storefront** — home, shop grid, product details, blog, contact
- 🛒 **Cart & checkout flow** — add to cart, review, payment, success page
- 🔐 **User accounts** — registration, login, personal info, account management
- 👨‍💼 **Admin dashboard** — product CRUD, image uploads, order overview
- 💳 **Stripe payment integration** (test mode) — secure server-side checkout
- 📝 **Blog** with detail pages
- 📱 **Responsive design** across all pages

## 🏗 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Vanilla JavaScript · HTML5 · SCSS · Less · CSS3 |
| **Backend** | Node.js · Express |
| **Payments** | Stripe |
| **Storage** | JSON-based persistence (products.json, users.json, orders.txt) |
| **Tooling** | npm · custom build scripts |

## 🚀 Quick Start

```bash
git clone https://github.com/SteckOff/ShevHeritage.git
cd ShevHeritage
npm install
cp .env.example .env     # add your Stripe test keys
npm start
```

The server boots on `http://localhost:3000`.

## 📁 Project Structure
ShevHeritage/
├── server/          # Express backend (index.js, upload.js, JSON store)
├── css, sass, less/ # Styling layers
├── js/              # Client-side scripts
├── img, fonts/      # Static assets
└── *.html           # Multi-page setup (index, shop-grid, checkout, admin, ...)
## 🔒 Security

All secrets (Stripe keys, server config) are loaded from environment variables. No credentials are committed to the repository — see `.env.example` for the required keys.

## 🛣 Roadmap

- [x] Product catalog with grid + detail views
- [x] Cart, checkout, payment success flow
- [x] Stripe payment integration
- [x] Admin dashboard with product CRUD
- [x] User accounts (register, login, account management)
- [x] Blog with detail pages
- [ ] Migrate JSON storage → PostgreSQL
- [ ] Order tracking dashboard for customers

## 📬 Contact

Built by **Grigorii Archakov** — full-stack developer based in Almaty, Kazakhstan.  
Open for freelance & contract work: **archakovgrigorii@gmail.com**

---

⭐ Star this repo if you find the architecture useful.
