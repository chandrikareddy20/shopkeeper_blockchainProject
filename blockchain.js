// ============ BLOCKCHAIN INTEGRATION MODULE ============
// This module handles all blockchain operations for Shopkeeper

const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');

// ============ CONFIGURATION ============
const GANACHE_RPC_URL = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545';
let CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x...'; // Set after deployment
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x...'; // Owner's private key

// ============ CONTRACT ABI ============
const SHOPKEEPER_ANCHOR_ABI = [
    "function anchorHash(bytes32 hash, uint256 txCount) public returns (uint256)",
    "function getAnchor(uint256 anchorId) public view returns (bytes32 hash, uint256 txCount, uint256 timestamp, address creator)",
    "function getTotalAnchors() public view returns (uint256)",
    "function verifyHash(bytes32 hash) public view returns (bool)"
];

// ============ GLOBAL VARIABLES ============
let provider;
let signer;
let contract;

// ============ INITIALIZATION ============
async function initializeBlockchain() {
    try {
        // Connect to Ganache
        provider = new ethers.JsonRpcProvider(GANACHE_RPC_URL);

        // Create signer:
        // 1) Prefer PRIVATE_KEY from .env
        // 2) Fallback to Ganache unlocked account 0 for auto-connect in local dev
        if (PRIVATE_KEY && PRIVATE_KEY !== '0x...') {
            signer = new ethers.Wallet(PRIVATE_KEY, provider);
        } else {
            signer = await provider.getSigner(0);
            console.log('⚠️  PRIVATE_KEY not set. Using Ganache account[0] signer (dev mode).');
        }

        // Connect to deployed contract if configured
        if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x...') {
            contract = new ethers.Contract(CONTRACT_ADDRESS, SHOPKEEPER_ANCHOR_ABI, signer);
        } else {
            contract = null;
        }

        console.log('✅ Blockchain signer initialized');
        console.log('📍 Connected to:', GANACHE_RPC_URL);
        console.log('🏠 Contract Address:', CONTRACT_ADDRESS);
        console.log('👤 Signer Address:', await signer.getAddress());

        if (!contract) {
            return { success: true, message: 'Signer ready. Contract not deployed yet.' };
        }
        return { success: true, message: 'Blockchain connected successfully' };
    } catch (error) {
        console.error('❌ Blockchain initialization failed:', error);
        return { success: false, message: error.message };
    }
}

// ============ DEPLOY CONTRACT ============
async function deployContract(businessName = 'Shopkeeper') {
    try {
        if (!signer) {
            return { success: false, message: 'Signer not initialized. Check PRIVATE_KEY and GANACHE_RPC_URL.' };
        }

        console.log('🚀 Deploying smart contract...');

        // Compile contract from source automatically
        const contractPath = path.join(__dirname, 'ShopkeeperAnchor.sol');
        const source = fs.readFileSync(contractPath, 'utf8');
        const input = {
            language: 'Solidity',
            sources: {
                'ShopkeeperAnchor.sol': {
                    content: source
                }
            },
            settings: {
                // Ganache UI commonly runs pre-Shanghai EVM; avoid PUSH0 opcode.
                evmVersion: 'paris',
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode']
                    }
                }
            }
        };
        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        if (output.errors && output.errors.length > 0) {
            const fatalError = output.errors.find((e) => e.severity === 'error');
            if (fatalError) {
                throw new Error(fatalError.formattedMessage);
            }
        }

        const compiled = output.contracts['ShopkeeperAnchor.sol']['ShopkeeperAnchor'];
        if (!compiled || !compiled.evm || !compiled.evm.bytecode || !compiled.evm.bytecode.object) {
            throw new Error('Compilation produced no bytecode');
        }

        const contractBytecode = '0x' + compiled.evm.bytecode.object;
        const contractAbi = compiled.abi || SHOPKEEPER_ANCHOR_ABI;

        const factory = new ethers.ContractFactory(contractAbi, contractBytecode, signer);
        const deployedContract = await factory.deploy(businessName);
        await deployedContract.waitForDeployment();
        const deployedAddress = await deployedContract.getAddress();
        CONTRACT_ADDRESS = deployedAddress;
        contract = new ethers.Contract(deployedAddress, SHOPKEEPER_ANCHOR_ABI, signer);

        console.log('✅ Contract deployed at:', deployedAddress);
        return {
            success: true,
            contract_address: deployedAddress,
            network: 'Ganache Local',
            message: 'Smart contract deployed successfully'
        };
    } catch (error) {
        console.error('❌ Contract deployment failed:', error);
        return { success: false, message: error.message };
    }
}

// ============ CREATE BLOCKCHAIN ANCHOR ============
async function createAnchor(anchorHash, txCount) {
    try {
        if (!contract) {
            return { success: false, message: 'Contract not deployed yet. Use /api/deploy-contract first.' };
        }

        console.log('🔗 Creating blockchain anchor...');

        // Call the smart contract function
        const tx = await contract.anchorHash(anchorHash, txCount);
        const receipt = await tx.wait();
        const totalAnchors = await contract.getTotalAnchors();
        const anchorId = Number(totalAnchors) - 1;

        console.log('✅ Anchor created with ID:', anchorId.toString());
        console.log('📄 Transaction Hash:', receipt.transactionHash);

        return {
            success: true,
            anchor: {
                id: anchorId,
                hash: anchorHash,
                tx_count: txCount,
                blockchain_tx_id: receipt.hash,
                timestamp: Date.now()
            },
            message: 'Blockchain anchor created successfully'
        };
    } catch (error) {
        console.error('❌ Anchor creation failed:', error);
        return { success: false, message: error.message };
    }
}

// ============ VERIFY BLOCKCHAIN INTEGRITY ============
async function verifyBlockchainIntegrity(currentHash) {
    try {
        if (!contract) {
            return {
                status: 'ERROR',
                message: 'Contract not deployed yet. Use /api/deploy-contract first.'
            };
        }

        console.log('🔍 Verifying blockchain integrity...');

        // Check if hash exists in contract
        const isValid = await contract.verifyHash(currentHash);

        if (isValid) {
            return {
                status: 'VERIFIED',
                message: 'Blockchain integrity confirmed',
                last_hash: currentHash
            };
        } else {
            return {
                status: 'TAMPERED',
                message: 'Hash not found in blockchain - possible tampering detected'
            };
        }
    } catch (error) {
        console.error('❌ Verification failed:', error);
        return {
            status: 'ERROR',
            message: 'Blockchain verification failed: ' + error.message
        };
    }
}

// ============ GET ANCHOR HISTORY ============
async function getAnchorHistory() {
    try {
        if (!contract) {
            return { success: false, message: 'Contract not deployed yet.' };
        }

        console.log('📚 Fetching anchor history...');

        const totalAnchors = await contract.getTotalAnchors();
        const anchors = [];

        // Get last 50 anchors (adjust as needed)
        const total = Number(totalAnchors);
        const startIndex = Math.max(0, total - 50);

        for (let i = startIndex; i < total; i++) {
            const anchor = await contract.getAnchor(i);
            anchors.push({
                id: i,
                anchor_hash: anchor.hash,
                tx_count: Number(anchor.txCount),
                timestamp: Number(anchor.timestamp) * 1000, // Convert to milliseconds
                creator: anchor.creator,
                status: 'confirmed'
            });
        }

        return {
            success: true,
            total_anchors: total,
            anchors: anchors.reverse() // Most recent first
        };
    } catch (error) {
        console.error('❌ Failed to fetch anchor history:', error);
        return { success: false, message: error.message };
    }
}

// ============ GET BLOCKCHAIN STATUS ============
async function getBlockchainStatus() {
    try {
        if (!provider) {
            return {
                isConnected: false,
                error: 'Provider not initialized'
            };
        }

        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || 0n;

        return {
            network: network.name,
            chainId: Number(network.chainId),
            blockNumber: blockNumber,
            gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
            contractAddress: CONTRACT_ADDRESS,
            isConnected: true
        };
    } catch (error) {
        return {
            isConnected: false,
            error: error.message
        };
    }
}

// ============ EXPORT FUNCTIONS ============
module.exports = {
    initializeBlockchain,
    deployContract,
    createAnchor,
    verifyBlockchainIntegrity,
    getAnchorHistory,
    getBlockchainStatus
};