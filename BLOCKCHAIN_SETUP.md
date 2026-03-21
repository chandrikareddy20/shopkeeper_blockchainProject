# 🔗 BLOCKCHAIN INTEGRATION STEPS

## 📋 BLOCKCHAIN CONNECTION GUIDE

This guide explains the current blockchain flow in this project. The backend now supports **auto-deploy** of `ShopkeeperAnchor.sol` from the Owner Dashboard (no manual Remix deployment required for local use).

---

## ✅ STEP 1: INSTALL DEPENDENCIES

First, install the required blockchain dependencies:

```bash
cd shopkeeper
npm install ethers@^6.8.0
```

---

## ✅ STEP 2: SETUP GANACHE LOCAL BLOCKCHAIN

### 2.1 Download & Install Ganache
1. Visit: https://trufflesuite.com/ganache/
2. Download the version for your operating system
3. Install and launch Ganache

### 2.2 Start Ganache Network
1. Click **"Quickstart"** in Ganache
2. This creates a local blockchain with:
   - **10 test accounts** (each with 100 ETH)
   - **RPC Server**: use the URL shown in Ganache (commonly `http://127.0.0.1:7545`)
   - **Network/Chain ID**: use the value shown in Ganache

### 2.3 Note Account Details
- Copy the **Private Key** from Account 1 (you'll need this)
- Note the **Account Address** (starts with 0x...)

---

## ✅ STEP 3: SETUP METAMASK WALLET (OPTIONAL)

### 3.1 Install MetaMask
1. Visit: https://metamask.io/
2. Install the browser extension
3. Create or import a wallet

### 3.2 Add Ganache Network
1. Open MetaMask
2. Click network dropdown → **"Add Network"**
3. Enter these details:
   ```
   Network Name: Ganache
   RPC URL: http://127.0.0.1:8545
   Chain ID: 1337
   Currency Symbol: ETH
   ```
4. Click **"Save"**

### 3.3 Import Ganache Account
1. In MetaMask, click account icon → **"Import Account"**
2. Paste the **Private Key** from Ganache Account 1
3. You should now see the account balance (100 ETH)

---

## ✅ STEP 4: DEPLOY SMART CONTRACT (AUTO DEPLOY)

1. Start backend with `npm start`.
2. Login as **Owner** in the app.
3. Open **Owner Dashboard**.
4. Click **Deploy Contract**.
5. Backend compiles `ShopkeeperAnchor.sol` and deploys automatically to Ganache.
6. You will see deployed address in dashboard message and terminal logs.

---

## ✅ STEP 5: CONFIGURE ENVIRONMENT VARIABLES

### 5.1 Create .env File
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

### 5.2 Update .env Values
Edit the `.env` file with your actual values:

```env
# ============ BLOCKCHAIN CONFIG ============
MONGODB_URI=mongodb://localhost:27017/shopkeeper
GANACHE_RPC_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=0x...  # Optional initially; auto-deploy sets runtime contract
PRIVATE_KEY=0x...       # Optional for local dev; fallback signer uses Ganache account[0]
```

**Security Warning**: Never commit `.env` files with real private keys to version control!

---

## ✅ STEP 6: START THE APPLICATION

### 6.1 Install All Dependencies
```bash
npm install
```

### 6.2 Start Server
```bash
npm start
```

You should see:
```
🚀 Shopkeeper server running on port 3000
🌐 Access at: http://localhost:3000
🔗 Blockchain initialized
```

---

## ✅ STEP 7: TEST BLOCKCHAIN FEATURES

### 7.1 Access Application
1. Open: http://localhost:3000/login.html
2. Login as **Owner** (username: `owner`, password: `1234`)

### 7.2 Test Blockchain Status
- Dashboard should show **"Blockchain Status: ❌"** initially
- This means blockchain is configured but no anchors created yet

### 7.3 Deploy Contract (First Time)
1. In Owner Dashboard, look for blockchain actions
2. Click **"Deploy Contract"** button
3. Should show success message with contract address

### 7.4 Create First Anchor
1. Add some sales transactions first
2. Click **"Create Anchor"** button
3. Should create blockchain anchor with transaction hash

### 7.5 Verify Integrity
1. Click **"Verify Blockchain"** button
2. Should show verification success

### 7.6 View Anchor History
1. Click **"View Anchor History"** button
2. Should show table of all blockchain anchors

---

## 🔧 TROUBLESHOOTING

### Issue: "Blockchain not available"
- Check if Ganache is running
- Verify RPC URL in `.env` file
- Check MetaMask network connection

### Issue: "Contract deployment failed"
- Ensure Ganache is running and RPC URL is correct in `.env`
- Confirm your Ganache account has ETH
- Restart backend after changing `.env`

### Issue: "Anchor creation failed"
- Ensure contract is deployed and address is correct
- Check private key in `.env` file
- Verify MetaMask has sufficient gas

### Issue: "Verification failed"
- Check if contract address is correct
- Ensure blockchain connection is working
- Try restarting the server

---

## 📊 BLOCKCHAIN FEATURES OVERVIEW

Once connected, your Shopkeeper will have:

### 🔐 **Cryptographic Integrity**
- SHA-256 hash chain for all transactions
- Tamper detection with exact breach location
- Immutable transaction history

### ⛓️ **Blockchain Anchoring**
- Periodic hash storage on blockchain
- External proof of data integrity
- Timestamp verification

### 🛡️ **Security Features**
- Owner-only blockchain operations
- Private key encryption
- Gas-free local blockchain

### 📈 **Dashboard Integration**
- Real-time blockchain status
- Anchor creation tracking
- Integrity verification reports

---

## 🎯 NEXT STEPS

1. **Test thoroughly** with sample transactions
2. **Monitor gas usage** in Ganache
3. **Backup private keys** securely
4. **Consider production deployment** on Polygon or Ethereum
5. **Implement automated anchoring** based on transaction volume

---

## 📞 SUPPORT

If you encounter issues:
1. Check the server console for error messages
2. Verify all environment variables are set correctly
3. Ensure Ganache and MetaMask are properly configured
4. Use Owner Dashboard -> Deploy Contract and check server logs

The blockchain integration is now ready for manual connection! 🚀