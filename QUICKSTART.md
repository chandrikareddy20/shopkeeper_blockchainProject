## 🚀 QUICK START GUIDE

**Get Shopkeeper running in 2 minutes**

---

## Step 1: Install Dependencies ⚙️

```bash
cd shopkeeper
npm install
```

**Expected output**: Creates `node_modules/` folder

---

## Step 3: Start the Server 🚀

```bash
npm start
```

**Expected output**:
```
============================================================
🚀 SHOPKEEPER SERVER RUNNING
============================================================
✔ Backend: http://localhost:3000
✔ Frontend: http://localhost:3000/login.html
✔ Health Check: http://localhost:3000/api/health
============================================================
```

---

## Step 4: Open in Browser 🌐

```
http://localhost:3000/login.html
```

---

## Step 5: Login 🔓

**Option A - Owner (Full Access)**
```
Username: owner
Password: 1234
Role: Owner
```
→ Redirects to Owner Dashboard

**Option B - Staff (Billing Only)**
```
Username: staff
Password: 1234
Role: Staff
```
→ Redirects to Billing Counter

---

## Step 5: Try It Out! 🎯

### OWNER DASHBOARD
- 📊 View sales statistics
- � Verify transaction integrity
- 📋 View transaction history
- 🗒️ View admin logs

### BILLING COUNTER
- 💰 Record new sales
- 📝 Fill product/qty/price/mode
- ✅ See instant confirmation
- 📜 View today's transactions

---

## Common Tasks 📋

### Record a Sale
1. Go to Billing counter
2. Enter: Product="Rice", Qty=2, Price=500, Mode=Cash
3. Click "Confirm & Record Sale"
4. See success message with transaction ID

### Check Integrity
1. Owner Dashboard → Click the verify button
2. See: ✔ VERIFIED or ❌ TAMPERED
3. If tampered, shows exact transaction ID

---

## Folder Structure 📁

```
shopkeeper/
├── server.js                    ← Main backend
├── package.json                 ← Dependencies
├── ShopkeeperAnchor.sol        ← Smart contract
├── .env.example                 ← Config template
│
├── frontend/
│   ├── login.html              ← Login page
│   ├── billing.html            ← Sales recording
│   ├── owner-dashboard.html    ← Analytics
│   └── Transaction.html        ← History
│
└── README.md                    ← Full documentation
```

---

## API Endpoints 🔌

**Login**
```bash
POST http://localhost:3000/api/login
Body: {"username":"owner","password":"1234","role":"owner"}
```

**Record Sale**
```bash
POST http://localhost:3000/api/addSale
Header: Authorization: Bearer <token>
Body: {"product":"Rice","qty":2,"price":500,"paymentMode":"Cash"}
```

**View Dashboard**
```bash
GET http://localhost:3000/api/dashboard
Header: Authorization: Bearer <token>
```

**Verify Integrity**
```bash
GET http://localhost:3000/api/verify
Header: Authorization: Bearer <token>
```

**Create Anchor**
```bash
POST http://localhost:3000/api/anchor
Header: Authorization: Bearer <token>
```

---

## Troubleshooting 🔧

**Port 3000 already in use?**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

**Module not found?**
```bash
npm install
```

**Can't connect to server?**
```bash
# Check server is running
curl http://localhost:3000/api/health

# Should return:
# {"status":"OK","timestamp":"...","transactions":0,"anchors":0}
```

---

## Next Steps 📚

1. **Understand the Architecture**
   → Read `ARCHITECTURE.md`

2. **Test the System**
   → Follow `TESTING.md`

3. **Deploy to Production**
   → Check `DEPLOYMENT.md`

---

## Key Features ✨

✅ **Tamper-Proof**: Rolling hash chain detects any modification
✅ **Immutable**: No delete/update operations allowed
✅ **Integrity Checkpoints**: Periodic hash snapshots for audit
✅ **Audit Trail**: All actions logged with user/timestamp
✅ **Role-Based**: Owner vs Staff access control
✅ **Real-Time**: Dashboard updates automatically
✅ **Mobile**: Responsive design for all devices

---

## Demo Flow 

1. **Owner logs in** → Dashboard shows 0 transactions
2. **Owner clicks "New Sale"** → Redirects to billing
3. **Owner records 5 sales** → Each creates hash link
4. **Owner views Dashboard** → Shows total ₹5000 (example)
5. **Owner verifies integrity** → All hashes valid ✔
6. **Owner reviews transaction log** → See audit trail and timestamps

---

## Important Notes ⚠️

- **In-Memory Database**: Data clears when server restarts
  - For production, integrate MongoDB/MySQL
- **Demo Credentials**: Replace with real users in production
- **Environment Variables**: Copy `.env.example` to `.env`

---

## Support 📞

**Check these files for help:**
- `README.md` - Full documentation
- `ARCHITECTURE.md` - System design
- `TESTING.md` - Testing guide
- `DEPLOYMENT.md` - Production setup

---

**Ready to get started?** 🎉
```bash
npm start
```

Then visit: **http://localhost:3000/login.html**

---

**Version**: 1.0.0
**Last Updated**: March 7, 2026