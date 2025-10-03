// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ComplianceManager.sol";
import "../src/RealEstateToken.sol";

contract ComplianceManagerTest is Test {
    ComplianceManager public complianceManager;
    RealEstateToken public token;
    
    address public serviceProvider = address(0x1);
    address public investorA = address(0x2);
    address public investorB = address(0x3);
    address public nonWhitelisted = address(0x4);
    
    function setUp() public {
        // Deploy compliance manager first (with dummy token address)
        complianceManager = new ComplianceManager(address(0x1));
        
        // Deploy token with compliance manager address
        token = new RealEstateToken("Test Token", "TEST", address(complianceManager));
        
        // Update compliance manager with correct token address
        complianceManager.setTokenAddress(address(token));
        
        // Grant roles
        token.grantRole(token.SERVICE_PROVIDER_ROLE(), address(complianceManager));
        complianceManager.grantRole(complianceManager.SERVICE_PROVIDER_ROLE(), serviceProvider);
        
        // Set property info
        token.setPropertyInfo("Test Property", "Test Location", 1000000, 0.001 ether);
    }
    
    function testWhitelistInvestor() public {
        vm.prank(serviceProvider);
        complianceManager.whitelistInvestor(investorA);
        
        assertTrue(complianceManager.isWhitelisted(investorA));
        assertEq(complianceManager.getWhitelistedInvestorsCount(), 1);
    }
    
    function testBlacklistInvestor() public {
        // First whitelist
        vm.prank(serviceProvider);
        complianceManager.whitelistInvestor(investorA);
        
        // Blacklist should fail if investor has tokens
        token.mint(investorA, 1000);
        vm.prank(serviceProvider);
        vm.expectRevert(abi.encodeWithSelector(
            ComplianceManager.BlacklistRequiresZeroBalance.selector,
            investorA,
            1000
        ));
        complianceManager.blacklistInvestor(investorA);
        
        // Should succeed after burning tokens
        token.burn(investorA, 1000);
        vm.prank(serviceProvider);
        complianceManager.blacklistInvestor(investorA);
        
        assertFalse(complianceManager.isWhitelisted(investorA));
        assertEq(complianceManager.getWhitelistedInvestorsCount(), 0);
    }
    
    function testValidateTransfer() public {
        // Whitelist both investors
        vm.prank(serviceProvider);
        complianceManager.whitelistInvestor(investorA);
        vm.prank(serviceProvider);
        complianceManager.whitelistInvestor(investorB);
        
        // Mint some tokens
        token.mint(investorA, 50000 * 10**18);
        
        // Valid transfer should pass
        (bool isValid, string memory reason) = complianceManager.validateTransfer(
            investorA,
            investorB,
            10000 * 10**18,
            0
        );
        assertTrue(isValid);
        assertEq(reason, "");
        
        // Transfer to non-whitelisted should fail
        (isValid, reason) = complianceManager.validateTransfer(
            investorA,
            nonWhitelisted,
            1000 * 10**18,
            0
        );
        assertFalse(isValid);
        assertEq(reason, "NotWhitelisted");
    }
    
    function testMaxHoldingLimit() public {
        // Whitelist investorB
        vm.prank(serviceProvider);
        complianceManager.whitelistInvestor(investorB);
        
        // Mint tokens to reach 10% of supply
        uint256 maxHolding = complianceManager.getMaxHolding();
        token.mint(investorA, maxHolding);
        
        // Transfer that would exceed 10% should fail
        (bool isValid, string memory reason) = complianceManager.validateTransfer(
            investorA,
            investorB,
            maxHolding + 1, // Transfer more than the max holding amount
            0
        );
        assertFalse(isValid);
        assertEq(reason, "ExceedsMaxHolding");
    }

    function testClawbackReceivedEvent() public {
        // Whitelist investor A
        vm.prank(serviceProvider);
        complianceManager.whitelistInvestor(investorA);
        
        // Grant roles
        token.grantRole(token.SERVICE_PROVIDER_ROLE(), address(this));
        
        // Mint tokens to A
        token.mint(investorA, 10_000 * 10**18);
        
        // Expect event on manager when clawback happens
        vm.expectEmit(true, false, false, true, address(complianceManager));
        emit ComplianceManager.ClawbackReceived(investorA, 1000 * 10**18);
        token.clawbackTokens(investorA, 1000 * 10**18);
    }
}
