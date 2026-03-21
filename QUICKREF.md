# ⚡ QUICK REFERENCE CARD

## 🚀 RUN SYSTEM NOW

```bash
cd shopkeeper
npm install
npm start
```

Then open: `http://localhost:3000/login.html`

---

## 🔐 LOGIN CREDENTIALS

| User | Password | Role |
|------|----------|------|
| owner | 1234 | Owner (Full Access) |
| staff | 1234 | Staff (Billing Only) |

---

## 📍 IMPORTANT URLs

| Page | URL |
|------|-----|
| Login | http://localhost:3000/login.html |
| Billing | http://localhost:3000/billing.html |
| Owner Dashboard | http://localhost:3000/owner-dashboard.html |
| Transactions | http://localhost:3000/Transaction.html |
| API Health | http://localhost:3000/api/health |

---

## 📚 DOCUMENTATION QUICK LINKS

| Document | Length | Purpose |
|----------|--------|---------|
| QUICKSTART.md | 5 min | Get started now |
| README.md | 20 min | Complete guide |
| ARCHITECTURE.md | 15 min | System design |
| VIVA.md | 30 min | Interview prep |
| TESTING.md | 20 min | Test scenarios |
| DEPLOYMENT.md | 15 min | Production setup |

---

## 🔨 COMMON COMMANDS

```bash
# Start server
npm start

# Stop server
Ctrl + C

# Install dependencies
npm install

# Update dependencies
npm update

# Check Node version
node --version

# Check npm version
npm --version
```

---

## 📊 SYSTEM FLOW

```
User
  ↓
Login → Authentication
  ↓
Billing/Dashboard → Depending on Role
  ↓
Server (Node.js Express)
  ↓
Hash Engine → Database
  ↓   
Scheduler → Audit checkpoint
```

---

## 🔗 API QUICK REFERENCE

### Login
```
POST /api/login
{username, password, role}
```

### Record Sale
```
POST /api/addSale
{product, qty, price, paymentMode}
Header: Authorization: Bearer <token>
```

### Get Dashboard
```
GET /api/dashboard
Header: Authorization: Bearer <token>
```

### View Transactions
```
GET /api/transactions
Header: Authorization: Bearer <token>
```

### Verify Integrity
```
GET /api/verify
Header: Authorization: Bearer <token>
```

---

## 📁 FILE STRUCTURE

```
shopkeeper/
├── server.js                    # Backend
├── package.json                 # Dependencies
├── frontend/
│   ├── login.html              # Login page
│   ├── billing.html            # Sales
│   ├── owner-dashboard.html    # Dashboard
│   ├── Transaction.html        # History
│   ├── *.js                    # Logic files
│   └── style.css               # Styling
│
└── [Documentation Files]        # .md files
```

---

## 🎯 FIRST-TIME SETUP (STEP BY STEP)

1. **Open Terminal/PowerShell**
   ```
   Navigate to project folder
   cd C:\Users\...\shopkeeper
   ```

2. **Install Dependencies**
   ```
   npm install
   ```
   Wait for completion (1-2 minutes)

3. **Start Server**
   ```
   npm start
   ```
   Should see: "SHOPKEEPER SERVER RUNNING"

4. **Open Browser**
   ```
   http://localhost:3000/login.html
   ```

5. **Login**
   ```
   Username: owner
   Password: 1234
   Role: Owner
   Click Login
   ```

6. **Start Using**
   ```
   Try the "New Sale" button
   Record a few transactions
   Check dashboard stats
   ```

---

## ✨ COOL FEATURES TO TRY

1. **Record a Sale**
   - Product: Any name
   - Qty: 2
   - Price: 500
   - Mode: Cash
   - Amount auto-calculates ✓

2. **View Transactions**
   - Click "View Transactions"
   - See rolling hash in truncated form
   - Click hash to see full SHA-256

3. **Verify Integrity**
   - Click "Verify" on the Owner Dashboard
   - Should show: ✔ VERIFIED
   - Shows how many transactions were checked

4. **View Analytics**
   - Dashboard shows total sales
   - Automatically calculates profit
   - Shows transaction breakdown

---

## 🐛 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Kill process using port: `netstat -ano \| findstr :3000` |
| npm not found | Install Node.js from nodejs.org |
| Module not found | Run `npm install` |
| Login fails | Use credentials: owner/1234 |
| Can't connect | Check server running: `http://localhost:3000/api/health` |

---

## 🎓 PREPARE FOR VIVA

**5-Minute Pitch:**
> "Shopkeeper is a tamper-resistant business management system using rolling hash chains for audit integrity. Each transaction generates a SHA-256 hash linked to the previous one, creating an unbreakable chain. Periodically, we record checkpoint hashes to provide an external proof of system state. This makes all fraud detectable—any modification breaks the hash chain and is immediately caught."

**Key Points to Remember:**
- ✅ Rolling hash (not heavy external dependencies)
- ✅ Immutable database (no UPDATE/DELETE)
- ✅ Periodic checkpoints (efficient)
- ✅ Verification detects tampering
- ✅ Audit record proves original state

**Read**: VIVA.md for 22 Q&A

---

## 🚀 PRODUCTION CHECKLIST

Before deploying to production:
- [ ] Read DEPLOYMENT.md
- [ ] Setup MongoDB (not in-memory)
- [ ] Configure environment variables
- [ ] Setup SSL/TLS certificate
- [ ] Setup error monitoring
- [ ] Setup backups
- [ ] Setup logging
- [ ] Security audit
- [ ] Load testing

---

## 📞 GETTING HELP

1. **Errors?** → Check browser console (F12)
2. **API issues?** → Check `http://localhost:3000/api/health`
3. **Design questions?** → Read ARCHITECTURE.md
4. **Test it?** → Follow TESTING.md
5. **Deploy it?** → Follow DEPLOYMENT.md
6. **Answer vivas?** → Read VIVA.md

---

## ✅ YOU'RE READY!

```
✓ System installed
✓ Server running
✓ Frontend accessible
✓ Transactions recordable
✓ Audit checkpoint integrated
✓ Documentation complete

You're good to go! 🚀
```

---

**Built with ❤️ on March 7, 2026**
**Version**: 1.0.0 Production Ready