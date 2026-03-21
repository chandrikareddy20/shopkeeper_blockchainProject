// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ShopkeeperAnchor
 * @dev Smart contract for anchoring business transaction hashes on blockchain
 * @author Shopkeeper System
 */
contract ShopkeeperAnchor {

    // ============ STRUCTURES ============
    struct Anchor {
        bytes32 hash;           // SHA-256 hash of transaction chain
        uint256 txCount;        // Number of transactions in this anchor
        uint256 timestamp;      // When anchor was created
        address creator;        // Who created this anchor
    }

    // ============ STATE VARIABLES ============
    string public businessName;           // Business identifier
    address public owner;                 // Contract owner
    Anchor[] public anchors;              // Array of all anchors
    mapping(bytes32 => bool) public hashExists; // Quick hash lookup

    // ============ EVENTS ============
    event AnchorCreated(
        uint256 indexed anchorId,
        bytes32 hash,
        uint256 txCount,
        address indexed creator,
        uint256 timestamp
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // ============ MODIFIERS ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(string memory _businessName) {
        businessName = _businessName;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ============ MAIN FUNCTIONS ============

    /**
     * @dev Anchor a new hash on the blockchain
     * @param _hash The SHA-256 hash to anchor
     * @param _txCount Number of transactions in this batch
     * @return anchorId The ID of the newly created anchor
     */
    function anchorHash(bytes32 _hash, uint256 _txCount)
        public
        onlyOwner
        returns (uint256 anchorId)
    {
        require(_hash != bytes32(0), "Hash cannot be zero");
        require(_txCount > 0, "Transaction count must be greater than zero");
        require(!hashExists[_hash], "Hash already anchored");

        // Create new anchor
        Anchor memory newAnchor = Anchor({
            hash: _hash,
            txCount: _txCount,
            timestamp: block.timestamp,
            creator: msg.sender
        });

        // Add to array
        anchors.push(newAnchor);
        anchorId = anchors.length - 1;

        // Mark hash as used
        hashExists[_hash] = true;

        // Emit event
        emit AnchorCreated(anchorId, _hash, _txCount, msg.sender, block.timestamp);

        return anchorId;
    }

    /**
     * @dev Verify if a hash exists in the blockchain
     * @param _hash The hash to verify
     * @return True if hash exists, false otherwise
     */
    function verifyHash(bytes32 _hash) public view returns (bool) {
        return hashExists[_hash];
    }

    /**
     * @dev Get details of a specific anchor
     * @param _anchorId The anchor ID to retrieve
     * @return hash The anchored hash
     * @return txCount Number of transactions
     * @return timestamp When it was anchored
     * @return creator Who anchored it
     */
    function getAnchor(uint256 _anchorId)
        public
        view
        returns (bytes32 hash, uint256 txCount, uint256 timestamp, address creator)
    {
        require(_anchorId < anchors.length, "Anchor does not exist");

        Anchor memory anchor = anchors[_anchorId];
        return (anchor.hash, anchor.txCount, anchor.timestamp, anchor.creator);
    }

    /**
     * @dev Get total number of anchors
     * @return Total number of anchors created
     */
    function getTotalAnchors() public view returns (uint256) {
        return anchors.length;
    }

    /**
     * @dev Get multiple anchors in a range (for pagination)
     * @param _startIndex Starting index
     * @param _count Number of anchors to return
     * @return Array of anchor details
     */
    function getAnchors(uint256 _startIndex, uint256 _count)
        public
        view
        returns (Anchor[] memory)
    {
        require(_startIndex < anchors.length, "Start index out of bounds");

        uint256 endIndex = _startIndex + _count;
        if (endIndex > anchors.length) {
            endIndex = anchors.length;
        }

        uint256 resultCount = endIndex - _startIndex;
        Anchor[] memory result = new Anchor[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = anchors[_startIndex + i];
        }

        return result;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Transfer ownership of the contract
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    /**
     * @dev Update business name
     * @param _newName New business name
     */
    function updateBusinessName(string memory _newName) public onlyOwner {
        businessName = _newName;
    }

    // ============ UTILITY FUNCTIONS ============

    /**
     * @dev Get contract version
     * @return Version string
     */
    function getVersion() public pure returns (string memory) {
        return "1.0.0";
    }

    /**
     * @dev Get contract information
     * @return Business name, owner, total anchors
     */
    function getContractInfo()
        public
        view
        returns (string memory, address, uint256)
    {
        return (businessName, owner, anchors.length);
    }
}