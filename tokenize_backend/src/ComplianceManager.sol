// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ComplianceManager
 * @dev Manages investor allowlist and enforces compliance rules for real estate tokenization
 */
contract ComplianceManager is AccessControl {
    bytes32 public constant SERVICE_PROVIDER_ROLE = keccak256("SERVICE_PROVIDER_ROLE");
    
    // 10% max holding limit (1000 basis points out of 10000)
    uint256 public constant MAX_HOLDING_BASIS_POINTS = 1000;
    uint256 public constant BASIS_POINTS_DENOMINATOR = 10000;
    
    // Reference to the token contract
    IERC20 public token;
    
    // Allowlist mapping
    mapping(address => bool) public isWhitelisted;
    
    // Array to track all whitelisted investors
    address[] public whitelistedInvestors;
    mapping(address => uint256) public investorIndex;
    
    // Events
    event InvestorWhitelisted(address indexed investor);
    event InvestorBlacklisted(address indexed investor);
    event TransferValidated(address indexed from, address indexed to, uint256 amount, bool approved);
    event ClawbackReceived(address indexed from, uint256 amount);
    
    // Errors
    error NotWhitelisted(address investor);
    error ExceedsMaxHolding(uint256 currentBalance, uint256 maxHolding);
    error BlacklistRequiresZeroBalance(address investor, uint256 balance);
    error Unauthorized();
    
    constructor(address _token) {
        token = IERC20(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SERVICE_PROVIDER_ROLE, msg.sender);
    }
    
    /**
     * @dev One-time wiring of token address after deployment (or update by service provider)
     */
    function setTokenAddress(address newToken) external onlyRole(SERVICE_PROVIDER_ROLE) {
        require(newToken != address(0), "InvalidToken");
        token = IERC20(newToken);
    }
    
    /**
     * @dev Called by the token after an admin clawback to record receipt
     */
    function notifyClawbackReceived(address from, uint256 amount) external {
        require(
            msg.sender == address(token) || hasRole(SERVICE_PROVIDER_ROLE, msg.sender),
            "OnlyToken"
        );
        emit ClawbackReceived(from, amount);
    }
    
    /**
     * @dev Whitelist an investor (only service provider)
     */
    function whitelistInvestor(address investor) external onlyRole(SERVICE_PROVIDER_ROLE) {
        if (isWhitelisted[investor]) return; // Already whitelisted
        
        isWhitelisted[investor] = true;
        whitelistedInvestors.push(investor);
        investorIndex[investor] = whitelistedInvestors.length - 1;
        
        emit InvestorWhitelisted(investor);
    }
    
    /**
     * @dev Blacklist an investor (only if balance is zero)
     */
    function blacklistInvestor(address investor) external onlyRole(SERVICE_PROVIDER_ROLE) {
        if (!isWhitelisted[investor]) return; // Already blacklisted
        
        uint256 balance = token.balanceOf(investor);
        if (balance > 0) {
            revert BlacklistRequiresZeroBalance(investor, balance);
        }
        
        isWhitelisted[investor] = false;
        
        // Remove from array
        uint256 index = investorIndex[investor];
        uint256 lastIndex = whitelistedInvestors.length - 1;
        
        if (index != lastIndex) {
            address lastInvestor = whitelistedInvestors[lastIndex];
            whitelistedInvestors[index] = lastInvestor;
            investorIndex[lastInvestor] = index;
        }
        
        whitelistedInvestors.pop();
        delete investorIndex[investor];
        
        emit InvestorBlacklisted(investor);
    }
    
    /**
     * @dev Validate a transfer against compliance rules
     */
    function validateTransfer(
        address from,
        address to,
        uint256 amount,
        uint256 recipientCurrentBalance
    ) external view returns (bool, string memory) {
        // Check if recipient is whitelisted (except for minting to zero address)
        if (to != address(0) && !isWhitelisted[to]) {
            return (false, "NotWhitelisted");
        }
        
        // Check 10% holding limit
        uint256 maxHolding = getMaxHolding();
        uint256 newBalance = recipientCurrentBalance + amount;
        
        if (newBalance > maxHolding) {
            return (false, "ExceedsMaxHolding");
        }
        
        return (true, "");
    }
    
    /**
     * @dev Get the maximum holding amount (10% of hard cap)
     */
    function getMaxHolding() public view returns (uint256) {
        // Use hard cap instead of current total supply for max holding calculation
        uint256 hardCap = 1_000_000 * 10**18; // 1M tokens
        return (hardCap * MAX_HOLDING_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR;
    }
    
    /**
     * @dev Get all whitelisted investors
     */
    function getAllWhitelistedInvestors() external view returns (address[] memory) {
        return whitelistedInvestors;
    }
    
    /**
     * @dev Get the number of whitelisted investors
     */
    function getWhitelistedInvestorsCount() external view returns (uint256) {
        return whitelistedInvestors.length;
    }
}
