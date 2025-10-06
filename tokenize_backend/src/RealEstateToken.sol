// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ComplianceManager.sol";

/**
 * @title RealEstateToken
 * @dev ERC-20 token representing fractional ownership of real estate
 */
contract RealEstateToken is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant SERVICE_PROVIDER_ROLE = keccak256("SERVICE_PROVIDER_ROLE");
    
    // Token economics
    uint256 public constant HARD_CAP = 1_000_000 * 10**18; // 1M tokens with 18 decimals
    uint256 public constant TOKEN_PRICE_WEI = 0.001 ether; // 0.001 ETH per token
    
    // Property information
    string public propertyName;
    string public propertyLocation;
    uint256 public propertyTotalValue;
    uint256 public tokenPriceWei;
    
    // Compliance manager reference
    ComplianceManager public complianceManager;
    
    // Total ETH raised
    uint256 public totalRaised;
    
    // Recovery destination is the ComplianceManager contract address
    
    // Events
    event PropertyInfoSet(string name, string location, uint256 totalValue, uint256 tokenPrice);
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethPaid);
    event TokensClawedBack(address indexed from, uint256 amount, address indexed operator);
    event TransferValidated(address indexed from, address indexed to, uint256 amount, bool approved);
    
    // Errors
    error CapExceeded(uint256 requested, uint256 available);
    error NotWhitelisted(address investor);
    error ExceedsMaxHolding(uint256 currentBalance, uint256 maxHolding);
    error InvalidComplianceManager();
    error InvalidAmount();
    error TransferFailed();
    
    constructor(
        string memory name,
        string memory symbol,
        address _complianceManager
    ) ERC20(name, symbol) {
        complianceManager = ComplianceManager(_complianceManager);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SERVICE_PROVIDER_ROLE, msg.sender);
    }
    
    /// @dev Restrict to service provider role for readability
    modifier onlyServiceProvider() {
        _checkRole(SERVICE_PROVIDER_ROLE);
        _;
    }
    
    /**
     * @dev Set property information (only service provider)
     */
    function setPropertyInfo(
        string memory name,
        string memory location,
        uint256 totalValue,
        uint256 _tokenPrice
    ) external onlyServiceProvider {
        propertyName = name;
        propertyLocation = location;
        propertyTotalValue = totalValue;
        tokenPriceWei = _tokenPrice;
        
        emit PropertyInfoSet(name, location, totalValue, _tokenPrice);
    }
    
    // No separate recovery setter; ComplianceManager receives clawbacks
    
    /**
     * @dev Purchase tokens with ETH
     */
    function purchaseTokens() external payable nonReentrant {
        // Check if caller is whitelisted
        if (!complianceManager.isWhitelisted(msg.sender)) {
            revert NotWhitelisted(msg.sender);
        }
        
        // Calculate token amount based on ETH sent (floor division)
        uint256 desiredTokenAmount = (msg.value / tokenPriceWei) * 10**18;
        
        if (desiredTokenAmount == 0) {
            revert InvalidAmount();
        }
        
        // Check 10% holding limit (strict: do not allow partial if exceeding max holding)
        uint256 currentBalance = balanceOf(msg.sender);
        uint256 maxHolding = complianceManager.getMaxHolding();
        
        if (currentBalance + desiredTokenAmount > maxHolding) {
            revert ExceedsMaxHolding(currentBalance + desiredTokenAmount, maxHolding);
        }
        
        // Determine mintable amount respecting remaining hard cap (allow partial and refund)
        uint256 remainingCap = HARD_CAP - totalSupply();
        uint256 mintAmount = desiredTokenAmount > remainingCap ? remainingCap : desiredTokenAmount;
        if (mintAmount == 0) {
            revert CapExceeded(desiredTokenAmount, remainingCap);
        }
        
        // Calculate actual ETH needed for mintAmount and refund excess
        uint256 ethNeeded = (mintAmount * tokenPriceWei) / 10**18;
        uint256 refund = msg.value - ethNeeded;
        
        // Mint tokens
        _mint(msg.sender, mintAmount);
        
        // Update total raised
        totalRaised += ethNeeded;
        
        // Refund excess ETH
        if (refund > 0) {
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            if (!success) {
                revert TransferFailed();
            }
        }
        
        emit TokensPurchased(msg.sender, mintAmount, ethNeeded);
    }
    
    /**
     * @dev Clawback tokens from an address (only service provider)
     */
    function clawbackTokens(address from, uint256 amount) external onlyServiceProvider {
        if (amount == 0) {
            revert InvalidAmount();
        }
        // Forced admin transfer to ComplianceManager address
        _transfer(from, address(complianceManager), amount);
        
        // Notify manager for eventing/analytics
        complianceManager.notifyClawbackReceived(from, amount);
        
        emit TokensClawedBack(from, amount, msg.sender);
    }
    
    /**
     * @dev Get property information
     */
    function getPropertyInfo() external view returns (
        string memory,
        string memory,
        uint256,
        uint256
    ) {
        return (propertyName, propertyLocation, propertyTotalValue, tokenPriceWei);
    }
    
    /**
     * @dev Check if the token sale is oversubscribed
     */
    function isOversubscribed() external view returns (bool) {
        return totalSupply() >= HARD_CAP;
    }
    
    /**
     * @dev Get total ETH raised
     */
    function getTotalRaised() external view returns (uint256) {
        return totalRaised;
    }
    
    /**
     * @dev Override _update to include compliance validation
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        // Skip validation for minting, burning, and explicit clawback transfers to manager
        bool isMint = from == address(0);
        bool isBurn = to == address(0);
        // Consider any transfer to the ComplianceManager as an admin clawback (already gated in clawbackTokens)
        bool isClawbackToManager = (to == address(complianceManager));
        if (isMint || isBurn || isClawbackToManager) {
            super._update(from, to, value);
            emit TransferValidated(from, to, value, true);
            return;
        }
        
        // Validate transfer through compliance manager
        uint256 recipientBalance = balanceOf(to);
        (bool isValid, string memory reason) = complianceManager.validateTransfer(
            from,
            to,
            value,
            recipientBalance
        );
        
        if (!isValid) {
            revert(reason);
        }
        
        super._update(from, to, value);
        emit TransferValidated(from, to, value, true);
    }
    
    /**
     * @dev Mint tokens (only for testing)
     */
    function mint(address to, uint256 amount) external onlyServiceProvider {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens (only for testing)
     */
    function burn(address from, uint256 amount) external onlyServiceProvider {
        _burn(from, amount);
    }
    
    /**
     * @dev Withdraw ETH (only service provider)
     */
    function withdraw() external onlyServiceProvider {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(msg.sender).call{value: balance}("");
            if (!success) {
                revert TransferFailed();
            }
        }
    }
}
