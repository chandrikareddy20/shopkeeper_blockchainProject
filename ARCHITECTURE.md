## 🏗️ SYSTEM ARCHITECTURE DOCUMENTATION

---

## 1️⃣ FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                      SHOPKEEPER SYSTEM FLOW                      │
└─────────────────────────────────────────────────────────────────┘

USER INTERFACE LAYER
├─ Login Page (login.html)
│   └─ Authenticates user credentials
│       ├─ Owner role → owner-dashboard.html
│       └─ Staff role → billing.html
│
├─ Billing Interface (billing.html)
│   └─ Record sales transactions
│       ├─ Product name
│       ├─ Quantity & Price
│       └─ Payment mode (Cash/UPI/Card)
│
├─ Owner Dashboard (owner-dashboard.html)
│   ├─ View analytics
│   ├─ Manage blockchain
│   ├─ Verify integrity
│   └─ View logs
│
└─ Transaction History (Transaction.html)
    └─ View all recorded sales
        ├─ Filter by mode
        ├─ Filter by status
        └─ View hash details

    ↓↓↓ HTTP/JSON ↓↓↓

API GATEWAY LAYER (server.js)
├─ Authentication Endpoints
│   ├─ POST /api/login
│   └─ POST /api/logout
│
├─ Transaction Endpoints
│   ├─ POST /api/addSale
│   ├─ GET /api/transactions
│   └─ PUT /api/void/:id
│
├─ Analytics Endpoints
│   └─ GET /api/dashboard
│
├─ Blockchain Endpoints
│   ├─ POST /api/anchor
│   ├─ GET /api/anchors
│   └─ GET /api/verify
│
├─ Admin Endpoints
│   └─ GET /api/adminLogs

    ↓↓↓ ↓↓↓

SECURITY & HASH LAYER
├─ Rolling Hash Engine
│   └─ SHA-256(transaction_data + previous_hash)
│
├─ Middleware
│   ├─ Authentication checker
│   ├─ Authorization checker
│   ├─ Admin action logger
│   └─ Input validation
│
└─ Immutable Rules
    ├─ No UPDATE queries allowed
    ├─ No DELETE queries allowed
    ├─ Only INSERT/VOID allowed
    └─ All actions logged

    ↓↓↓ ↓↓↓

DATABASE LAYER
├─ In-Memory Storage (Development/Testing)
│   ├─ transactions[]
│   ├─ blockchainAnchors[]
│   ├─ adminLogs[]
│   └─ sessions{}
│
└─ Persistent Storage (Production)
    └─ MongoDB / MySQL
        ├─ Transactions table
        │   ├─ id (auto)
        │   ├─ product, qty, price
        │   ├─ previous_hash, current_hash
        │   ├─ is_voided
        │   └─ created_by, timestamp
        │
        ├─ Anchors table
        │   ├─ id (auto)
        │   ├─ anchor_hash
        │   ├─ tx_count
        │   └─ blockchain_tx_id
        │
        └─ Admin Logs table
            ├─ id (auto)
            ├─ action, timestamp
            ├─ user_id, ip
            └─ status

    ↓↓↓ EVERY 10 Min OR 100 TX ↓↓↓

BLOCKCHAIN ANCHORING LAYER
├─ Scheduler (node-schedule)
│   └─ Triggers anchor creation
│
├─ Anchor Generator
│   ├─ Gets latest rolling hash
│   ├─ Calculates anchor hash
│   └─ Prepares smart contract call
│
└─ Smart Contract (ShopkeeperAnchor.sol)
    ├─ Storage
    │   └─ anchors[] (immutable array)
    │
    ├─ Functions
    │   ├─ createAnchor() - Store new anchor
    │   ├─ getLatestAnchor() - Latest proof
    │   ├─ verifyTransactionHash() - Lookup
    │   └─ verifyChainIntegrity() - Validate
    │
    └─ Events
        └─ AnchorCreated (indexed by ID, hash, timestamp)

    ↓↓↓ ↓↓↓

BLOCKCHAIN NETWORK (Ganache Local)
└─ Immutable record of all anchors
    ├─ Block N: Anchor #1
    ├─ Block M: Anchor #2
    ├─ Block K: Anchor #3
    └─ ... (cryptographically linked)
```

---

## 2️⃣ TRANSACTION LIFECYCLE

### State 1: BEFORE RECORDING
```
User enters sale data:
  product: "Rice"
  qty: 2
  price: 500
  paymentMode: "Cash"
```

### State 2: VALIDATION
```
Backend checks:
  ✓ All fields present
  ✓ Qty > 0, Price > 0
  ✓ User authenticated
  ✓ User authorized
```

### State 3: HASH CALCULATION
```
Combined data = {
  product: "Rice",
  qty: 2,
  price: 500,
  amount: 1000,
  paymentMode: "Cash",
  timestamp: "2024-03-07T10:30:45Z",
  previous_hash: "abc123..."
}

SHA256(combined_data) = "hash_xyz789..."
```

### State 4: STORAGE
```
Database record created:
{
  id: 42,
  product: "Rice",
  qty: 2,
  price: 500,
  amount: 1000,
  paymentMode: "Cash",
  previous_hash: "abc123...",
  current_hash: "xyz789...",
  is_voided: false,
  timestamp: "2024-03-07T10:30:45Z",
  created_by: "staff_user"
}
```

### State 5: RESPONSE TO USER
```
Success response:
{
  message: "✅ Sale recorded successfully",
  transaction: {
    id: 42,
    amount: 1000,
    hash: "xyz789..." (truncated),
    timestamp: "2024-03-07T10:30:45Z"
  }
}
```

### State 6: AUTO-ANCHOR (Periodic)
```
After 100 transactions or 10 minutes:
  
Rolling hash chain complete:
  Tx1 → Tx2 → Tx3 → ... → Tx100
  └─ Final hash = "abc789def..."

Blockchain anchor created:
  Anchor #{
    id: 5,
    transactionHash: "abc789def...",
    transactionCount: 100,
    timestamp: 1709874645
  }
  
Stored in smart contract on Ganache
```

---

## 3️⃣ ROLLING HASH CHAIN

### How It Works

```
Transaction 1:
  Data: Product=Rice, Qty=2, Price=500, ...
  Hash = SHA256(data + "GENESIS")
  Result: "abc123..."

Transaction 2:
  Data: Product=Oil, Qty=1, Price=1000, ...
  Hash = SHA256(data + "abc123...")
  Result: "def456..."

Transaction 3:
  Data: Product=Salt, Qty=5, Price=50, ...
  Hash = SHA256(data + "def456...")
  Result: "ghi789..."

Chain: abc123 → def456 → ghi789 → ...
```

### Tampering Detection

```
Original state:
  Tx2: old_hash = "def456"
  Tx3: Hash = SHA256(data + "def456") = "ghi789"

Attacker modifies Tx2:
  Tx2_modified: new_hash = "def999" (recalculated with changed data)
  Tx3: Hash should be = SHA256(data + "def999") 
       But stored hash = "ghi789" (doesn't match!)
       
Verification detects: CHAIN BROKEN at Tx3 ❌
```

---

## 4️⃣ SECURITY ARCHITECTURE

### Layer 1: INPUT VALIDATION
```
├─ Required field check
├─ Data type validation
├─ Range validation (qty > 0, price > 0)
├─ String sanitization
└─ SQL injection prevention (using parameterized queries)
```

### Layer 2: AUTHENTICATION
```
├─ Username/password validation
├─ Token generation (SHA256 of username + timestamp)
├─ Session storage
├─ Token verification on each request
└─ Logout/session cleanup
```

### Layer 3: AUTHORIZATION
```
├─ Role-based access control (RBAC)
│   ├─ Owner: Full access
│   │   ├─ Create anchors
│   │   ├─ Void transactions
│   │   └─ View admin logs
│   │
│   └─ Staff: Limited access
│       ├─ Add sales (only)
│       ├─ View transactions
│       └─ No delete/verify/logs
│
└─ Endpoint protection
    ├─ ownerOnly middleware
    └─ Denies staff access
```

### Layer 4: DATA INTEGRITY
```
├─ Hash calculation (SHA256)
├─ Chain linking (previous hash)
├─ Immutability rules
│   ├─ No UPDATE allowed
│   ├─ No DELETE allowed
│   ├─ Only INSERT/VOID
│   └─ Void = mark is_voided: true
│
└─ Verification
    ├─ Recalculate all hashes
    ├─ Compare with stored hashes
    ├─ Report tampering location
    └─ Blockchain proof
```

### Layer 5: AUDIT LOGGING
```
├─ Every action logged
│   ├─ Admin action (method + URL)
│   ├─ User ID
│   ├─ IP address
│   ├─ Timestamp
│   └─ Status
│
├─ Log storage
│   └─ adminLogs[] array
│
└─ Log access
    └─ Owner only via /api/adminLogs
```

### Layer 6: BLOCKCHAIN PROOF
```
├─ Periodic anchoring
│   ├─ Latest rolling hash
│   ├─ Transaction count
│   └─ Timestamp
│
├─ Smart contract storage
│   └─ Immutable array of anchors
│
└─ External verification
    ├─ Query blockchain
    ├─ Retrieve anchor hash
    ├─ Compare with current hash
    └─ Detect tampering
```

---

## 5️⃣ API CALLS TO FLOW

### Example 1: User Records a Sale

```
REQUEST:
POST /api/addSale
Authorization: Bearer <token>
Content-Type: application/json

{
  "product": "Rice",
  "qty": 2,
  "price": 500,
  "paymentMode": "Cash"
}

PROCESSING:
1. Authenticate user (check token)
2. Validate fields
3. Fetch previous transaction
4. Get previous_hash
5. Create transaction object
6. Calculate current_hash
7. Store in database
8. Check auto-anchor trigger
9. Return success response

RESPONSE (201 Created):
{
  "message": "✅ Sale recorded successfully",
  "transaction": {
    "id": 42,
    "amount": 1000,
    "hash": "xyz789...",
    "timestamp": "2024-03-07T10:30:45Z"
  }
}
```

### Example 2: Verify Blockchain Integrity

```
REQUEST:
GET /api/verify
Authorization: Bearer <token>

PROCESSING:
1. Authenticate user
2. Fetch all transactions
3. For each transaction i:
     a. Get current_hash (stored)
     b. Get previous_hash (stored)
     c. Recalculate expected_hash = SHA256(data + previous_hash)
     d. Compare: expected_hash === current_hash?
     e. If NO: return TAMPERED status + transaction_id
4. If all match: return VERIFIED status

SUCCESS RESPONSE:
{
  "status": "✔ VERIFIED",
  "message": "All hashes valid - No tampering",
  "transactions_checked": 100,
  "last_hash": "abc789def..."
}

FRAUD RESPONSE:
{
  "status": "❌ TAMPERED",
  "message": "Hash mismatch detected",
  "broken_at_transaction_id": 35
}
```

### Example 3: Create Blockchain Anchor

```
REQUEST:
POST /api/anchor
Authorization: Bearer <token>

PROCESSING:
1. Authenticate user
2. Check role (Owner only)
3. Fetch latest transaction
4. Get latest.current_hash
5. Create anchor object
6. Generate anchor_hash = SHA256(tx_hash + timestamp)
7. Call smart contract createAnchor()
8. Store anchor record
9. Return success with blockchain tx ID

RESPONSE (201 Created):
{
  "message": "✔ Blockchain anchor created",
  "anchor": {
    "id": 5,
    "anchor_hash": "abc123...",
    "tx_count": 100,
    "blockchain_tx_id": "0x...",
    "timestamp": "2024-03-07T10:35:00Z"
  }
}
```

---

## 6️⃣ DATABASE SCHEMA

### Transactions Collection
```javascript
{
  id: Number,                    // Auto-increment
  product: String,               // Item name
  qty: Number,                   // Quantity
  price: Number,                 // Unit price
  amount: Number,                // qty * price
  payment_mode: String,          // Cash/UPI/Card
  timestamp: ISOString,          // ISO 8601 format
  previous_hash: String,         // Hash of previous transaction
  current_hash: String,          // SHA256 hash of this transaction
  is_voided: Boolean,            // false=valid, true=voided
  created_by: String,            // Username who created
  
  // Indexes (for performance)
  // - Index on id (primary)
  // - Index on timestamp (for range queries)
  // - Index on current_hash (for lookups)
}
```

### Blockchain Anchors Collection
```javascript
{
  id: Number,                    // Auto-increment
  anchor_hash: String,           // SHA256 of anchor
  last_transaction_hash: String, // Latest rolling hash
  last_transaction_id: Number,   // Last transaction ID
  transaction_count: Number,     // Total tx at anchor time
  timestamp: ISOString,          // When anchor created
  blockchain_tx_id: String,      // Smart contract call tx hash
  status: String,                // "ANCHORED" / "AUTO_ANCHORED"
  
  // Indexes
  // - Index on id (primary)
  // - Index on timestamp (for history)
  // - Index on blockchain_tx_id (for verification)
}
```

### Admin Logs Collection
```javascript
{
  id: Number,                    // Auto-increment
  action: String,                // "GET /api/dashboard", etc.
  timestamp: ISOString,          // When action occurred
  ip: String,                    // User IP address
  userId: String,                // Username
  status: String,                // "initiated", "success", "error"
  
  // Indexes
  // - Index on userId (find user actions)
  // - Index on timestamp (find recent actions)
}
```

---

## 7️⃣ SMART CONTRACT ARCHITECTURE

### Data Structures

```solidity
struct Anchor {
    uint256 id;                    // Unique identifier
    bytes32 transactionHash;       // Rolling hash from DB
    bytes32 anchorHash;            // Hash of anchor metadata
    uint256 transactionCount;      // Number of tx at anchor
    uint256 timestamp;             // When anchored (block.timestamp)
    string businessId;             // Business identifier
    bool verified;                 // Verification flag
}
```

### State Variables

```solidity
address public owner;              // Contract owner
uint256 public anchorCount;        // Total anchors created
Anchor[] public anchors;           // Array of all anchors

mapping(uint256 => Anchor) public anchorById;
mapping(bytes32 => uint256) public hashToId;
```

### Key Functions

```solidity
// Create new anchor
createAnchor(bytes32 hash, uint256 count, string businessId)
  → Returns: anchor ID

// Verify hash exists
verifyTransactionHash(bytes32 hash)
  → Returns: (found, anchorId)

// Get specific anchor
getAnchor(uint256 id)
  → Returns: full anchor details

// Check chain integrity
verifyChainIntegrity()
  → Returns: (isValid, lastId)
```

---

## 8️⃣ ERROR HANDLING

### Frontend Errors
```
User-facing messages:
├─ ❌ "Invalid credentials" (login failure)
├─ ❌ "Please fill in all fields" (validation)
├─ ✅ "Sale recorded successfully" (success)
├─ 🔄 "Processing..." (in-progress)
└─ ⚠️ "Network error - please try again" (connectivity)
```

### Backend Errors
```
HTTP Status Codes:
├─ 200 OK - Successful request
├─ 201 Created - Resource created
├─ 400 Bad Request - Invalid input
├─ 401 Unauthorized - Missing/invalid token
├─ 403 Forbidden - Access denied (role-based)
├─ 404 Not Found - Resource doesn't exist
└─ 500 Server Error - Unexpected error

Error Response Format:
{
  "message": "Error description",
  "error": "Technical details (dev only)"
}
```

---

## 9️⃣ PERFORMANCE OPTIMIZATION

### Frontend
```
├─ Vanilla JavaScript (no framework overhead)
├─ CSS caching
├─ Minimal DOM manipulations
├─ Event delegation
└─ Lazy loading where applicable
```

### Backend
```
├─ In-memory data structure
├─ No unnecessary DB queries
├─ Hash calculation optimized
├─ Index usage (when DB integrated)
├─ Connection pooling
└─ Request compression
```

### Blockchain
```
├─ Batched anchors (not per-transaction)
├─ Minimal contract state writes
├─ Use of events (don't store data)
└─ Efficient hash calculation (keccak256)
```

---

**Architecture Version**: 1.0.0
**Last Updated**: March 7, 2026
**Status**: Production Ready ✅