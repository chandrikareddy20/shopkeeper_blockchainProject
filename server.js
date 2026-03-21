// ============ SHOPKEEPER BACKEND WITH BLOCKCHAIN INTEGRATION ============
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import blockchain module
const blockchain = require('./blockchain');

// Load environment variables
dotenv.config();

// ============ EXPRESS SETUP ============
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend'));

// ============ DATABASE MODELS ============
// Transaction Schema
const transactionSchema = new mongoose.Schema({
    id: Number,
    product: String,
    qty: Number,
    price: Number,
    amount: Number,
    payment_mode: String,
    timestamp: Date,
    current_hash: String,
    previous_hash: String,
    is_voided: { type: Boolean, default: false },
    voided_at: Date,
    voided_by: String
});

// Anchor Schema
const anchorSchema = new mongoose.Schema({
    id: Number,
    anchor_hash: String,
    tx_count: Number,
    timestamp: Date,
    blockchain_tx_id: String,
    status: String
});

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String, // In production, hash this!
    role: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);
const Anchor = mongoose.model('Anchor', anchorSchema);
const User = mongoose.model('User', userSchema);

// ============ GLOBAL VARIABLES ============
let nextTransactionId = 1;
let nextAnchorId = 1;
let currentHash = 'GENESIS_HASH'; // Starting hash
let adminLogs = [];

// ============ UTILITY FUNCTIONS ============
function generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function createTransactionHash(tx) {
    const data = JSON.stringify(tx);
    return generateHash(data);
}

// ============ AUTHENTICATION MIDDLEWARE ============
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    // Simple token validation (in production, use JWT)
    if (token !== 'valid_token_123') {
        return res.status(403).json({ message: 'Invalid token' });
    }

    next();
}

function requireOwner(req, res, next) {
    // In production, check user role from token
    next();
}

// ============ ADMIN ACTIVITY LOGGER ============
app.use((req, res, next) => {
    // Log only API calls and skip the logs endpoint itself to avoid noise loops
    if (!req.path.startsWith('/api') || req.path === '/api/adminLogs') {
        return next();
    }

    const start = Date.now();
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = token === 'valid_token_123' ? 'authenticated-user' : 'anonymous';

    res.on('finish', () => {
        adminLogs.push({
            id: adminLogs.length + 1,
            action: `${req.method} ${req.originalUrl}`,
            userId,
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            durationMs: Date.now() - start
        });

        // Keep only last 200 logs in memory
        if (adminLogs.length > 200) {
            adminLogs = adminLogs.slice(-200);
        }
    });

    next();
});

// ============ AUTHENTICATION ENDPOINTS ============
app.post('/api/login', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const user = await User.findOne({ username, password, role });
        if (user) {
            res.json({
                token: 'valid_token_123',
                role: user.role,
                message: 'Login successful'
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Login error', error: error.message });
    }
});

app.post('/api/logout', authenticateToken, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// ============ SALES ENDPOINTS ============
app.post('/api/addSale', authenticateToken, async (req, res) => {
    const { product, qty, price, paymentMode } = req.body;
    const amount = qty * price;

    try {
        // Create transaction
        const transaction = new Transaction({
            id: nextTransactionId++,
            product,
            qty,
            price,
            amount,
            payment_mode: paymentMode,
            timestamp: new Date(),
            previous_hash: currentHash,
            is_voided: false
        });

        // Generate hash
        transaction.current_hash = createTransactionHash(transaction);
        currentHash = transaction.current_hash;

        await transaction.save();

        res.json({
            message: 'Sale recorded successfully',
            transaction: {
                id: transaction.id,
                amount: transaction.amount,
                hash: transaction.current_hash,
                timestamp: transaction.timestamp
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error recording sale', error: error.message });
    }
});

// ============ DASHBOARD ENDPOINTS ============
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const transactions = await Transaction.find({});
        const validTransactions = transactions.filter(tx => !tx.is_voided);
        const voidedTransactions = transactions.filter(tx => tx.is_voided);

        const totalSales = validTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const totalExpenses = 0; // Add expense tracking if needed
        const netProfit = totalSales - totalExpenses;

        // Get blockchain status
        let blockchainStatus = 'Not Connected';
        let blockchainConnected = false;
        let contractDeployed = false;
        try {
            const bcStatus = await blockchain.getBlockchainStatus();
            blockchainConnected = !!bcStatus.isConnected;
            contractDeployed = !!(
                bcStatus.contractAddress &&
                bcStatus.contractAddress !== '0x...'
            );

            if (!blockchainConnected) {
                blockchainStatus = 'Not Connected';
            } else if (!contractDeployed) {
                blockchainStatus = 'Connected (Contract Not Deployed)';
            } else {
                blockchainStatus = 'Connected (Contract Deployed)';
            }
        } catch (error) {
            blockchainStatus = 'Error';
        }

        // Get last anchor time
        const lastAnchor = await Anchor.findOne().sort({ timestamp: -1 });
        const lastAnchorTime = lastAnchor ? lastAnchor.timestamp : null;

        res.json({
            totalSales,
            transactionCount: validTransactions.length,
            totalExpenses,
            netProfit,
            voidedCount: voidedTransactions.length,
            totalVoided: voidedTransactions.reduce((sum, tx) => sum + tx.amount, 0),
            blockchainStatus,
            blockchainConnected,
            contractDeployed,
            lastAnchorTime
        });
    } catch (error) {
        res.status(500).json({ message: 'Dashboard error', error: error.message });
    }
});

// ============ BLOCKCHAIN ENDPOINTS ============

// Deploy Contract
app.post('/api/deploy-contract', authenticateToken, requireOwner, async (req, res) => {
    try {
        const result = await blockchain.deployContract();
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        res.status(500).json({ message: 'Contract deployment failed', error: error.message });
    }
});

// Create Anchor
app.post('/api/anchor', authenticateToken, requireOwner, async (req, res) => {
    try {
        // Get current rolling hash
        const transactions = await Transaction.find({ is_voided: false });
        const anchorHash = currentHash;
        const txCount = transactions.length;

        const result = await blockchain.createAnchor(anchorHash, txCount);

        if (result.success) {
            // Save anchor to database
            const anchor = new Anchor({
                id: nextAnchorId++,
                anchor_hash: result.anchor.hash,
                tx_count: result.anchor.tx_count,
                timestamp: new Date(result.anchor.timestamp),
                blockchain_tx_id: result.anchor.blockchain_tx_id,
                status: 'confirmed'
            });
            await anchor.save();

            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        res.status(500).json({ message: 'Anchor creation failed', error: error.message });
    }
});

// Verify Blockchain Integrity
app.get('/api/verify', authenticateToken, async (req, res) => {
    try {
        const result = await blockchain.verifyBlockchainIntegrity(currentHash);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Verification failed: ' + error.message
        });
    }
});

// Get Anchor History
app.get('/api/anchors', authenticateToken, async (req, res) => {
    try {
        const dbAnchors = await Anchor.find().sort({ timestamp: -1 });
        const bcAnchors = await blockchain.getAnchorHistory();

        // Use blockchain data if available, otherwise use DB data
        if (bcAnchors.success) {
            res.json(bcAnchors);
        } else {
            res.json({
                success: true,
                total_anchors: dbAnchors.length,
                anchors: dbAnchors.map(anchor => ({
                    id: anchor.id,
                    anchor_hash: anchor.anchor_hash,
                    tx_count: anchor.tx_count,
                    timestamp: anchor.timestamp.getTime(),
                    blockchain_tx_id: anchor.blockchain_tx_id,
                    status: anchor.status
                }))
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch anchors', error: error.message });
    }
});

// ============ OTHER ENDPOINTS ============
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ timestamp: -1 });
        res.json(transactions.map(tx => ({
            id: tx.id,
            product: tx.product,
            qty: tx.qty,
            price: tx.price,
            amount: tx.amount,
            payment_mode: tx.payment_mode,
            timestamp: tx.timestamp,
            current_hash: tx.current_hash.substring(0, 20) + '...',
            full_hash: tx.current_hash,
            status: tx.is_voided ? 'Voided' : 'Active',
            is_voided: tx.is_voided
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions', error: error.message });
    }
});

app.put('/api/void/:id', authenticateToken, requireOwner, async (req, res) => {
    try {
        const txId = parseInt(req.params.id);
        const transaction = await Transaction.findOne({ id: txId });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.is_voided) {
            return res.status(400).json({ message: 'Transaction already voided' });
        }

        transaction.is_voided = true;
        transaction.voided_at = new Date();
        transaction.voided_by = 'owner'; // In production, get from token

        await transaction.save();

        res.json({ message: 'Transaction voided successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error voiding transaction', error: error.message });
    }
});

app.get('/api/adminLogs', authenticateToken, requireOwner, async (req, res) => {
    res.json({
        total_logs: adminLogs.length,
        logs: adminLogs.slice(-100).reverse()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        transactions: 0, // Would count from DB
        sessions: 1
    });
});

// ============ INITIALIZATION ============
async function initializeApp() {
    try {
        // Connect to MongoDB (optional)
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('?? Connected to MongoDB');
        }

        // Initialize blockchain connection
        const bcResult = await blockchain.initializeBlockchain();
        if (bcResult.success) {
            console.log('?? Blockchain initialized');
        } else {
            console.log('??  Blockchain not available:', bcResult.message);
        }

        // Create default users if they don't exist
        const existingUsers = await User.countDocuments();
        if (existingUsers === 0) {
            await User.insertMany([
                { username: 'owner', password: '1234', role: 'owner' },
                { username: 'staff', password: '1234', role: 'staff' }
            ]);
            console.log('Default users created');
        }

        // Start server
        app.listen(PORT, () => {
            console.log(`Shopkeeper server running on port ${PORT}`);
            console.log(`Access at: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Initialization failed:', error);
        process.exit(1);
    }
}

// Start the application
initializeApp();
