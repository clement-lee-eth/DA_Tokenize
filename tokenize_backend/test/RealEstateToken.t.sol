// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ComplianceManager.sol";
import "../src/RealEstateToken.sol";

contract RealEstateTokenTest is Test {
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
        // We need to redeploy with the correct token address
        complianceManager.setTokenAddress(address(token));
        
        // Grant roles
        token.grantRole(token.SERVICE_PROVIDER_ROLE(), address(complianceManager));
        complianceManager.grantRole(complianceManager.SERVICE_PROVIDER_ROLE(), serviceProvider);
        
        // Set property info
        token.setPropertyInfo("Test Property", "Test Location", 1000000, 0.001 ether);
        
        // Whitelist investors
        vm.prank(serviceProvider);
        complianceManager.whitelistInvestor(investorA);
        vm.prank(serviceProvider);
        complianceManager.whitelistInvestor(investorB);
    }
    
    function testPurchaseTokens() public {
        uint256 ethAmount = 10 ether; // 10 ETH
        uint256 expectedTokens = (ethAmount / 0.001 ether) * 10**18; // 10,000 tokens
        
        vm.deal(investorA, ethAmount);
        vm.prank(investorA);
        token.purchaseTokens{value: ethAmount}();
        
        assertEq(token.balanceOf(investorA), expectedTokens);
        assertEq(token.getTotalRaised(), ethAmount);
    }
    
    function testPurchaseTokensRefund() public {
        uint256 ethAmount = 10.5 ether; // 10.5 ETH
        uint256 expectedTokens = (ethAmount / 0.001 ether) * 10**18; // 10,500 tokens (floor division)
        uint256 expectedEthUsed = (expectedTokens * 0.001 ether) / 10**18; // ETH actually used
        uint256 expectedRefund = ethAmount - expectedEthUsed; // Refund amount
        
        vm.deal(investorA, ethAmount);
        uint256 initialBalance = investorA.balance;
        
        vm.prank(investorA);
        token.purchaseTokens{value: ethAmount}();
        
        assertEq(token.balanceOf(investorA), expectedTokens);
        assertEq(token.getTotalRaised(), expectedEthUsed);
        assertEq(investorA.balance, initialBalance - ethAmount + expectedRefund);
    }
    
    function testPurchaseTokensNonWhitelisted() public {
        vm.deal(nonWhitelisted, 1 ether);
        vm.prank(nonWhitelisted);
        vm.expectRevert(abi.encodeWithSelector(
            RealEstateToken.NotWhitelisted.selector,
            nonWhitelisted
        ));
        token.purchaseTokens{value: 1 ether}();
    }
    
    function testPurchaseTokensPartialOnCap() public {
        // Fill near the cap
        uint256 nearCapTokens = (1_000_000 - 10_000) * 10**18; // leave 10,000 tokens remaining
        token.grantRole(token.SERVICE_PROVIDER_ROLE(), address(this));
        token.mint(address(this), nearCapTokens);
        
        // Investor A attempts to buy 20,000 tokens worth of ETH
        uint256 desiredTokens = 20_000 * 10**18;
        uint256 desiredEth = (desiredTokens * 0.001 ether) / 10**18; // 20 ETH
        
        vm.deal(investorA, desiredEth);
        uint256 beforeBalance = investorA.balance;
        
        vm.prank(investorA);
        token.purchaseTokens{value: desiredEth}();
        
        // Only 10,000 tokens should be minted, 10 ETH used, 10 ETH refunded
        assertEq(token.balanceOf(investorA), 10_000 * 10**18);
        assertEq(token.getTotalRaised(), 10 ether);
        assertEq(investorA.balance, beforeBalance - 20 ether + 10 ether);
        assertTrue(token.isOversubscribed());
    }
    
    function testPurchaseTokensExceedsMaxHolding() public {
        // Purchase tokens that would exceed 10% limit
        uint256 ethAmount = 120 ether; // 120,000 tokens (12% of 1M cap)
        
        vm.deal(investorA, ethAmount);
        vm.prank(investorA);
        vm.expectRevert(abi.encodeWithSelector(
            RealEstateToken.ExceedsMaxHolding.selector,
            120_000 * 10**18,
            100_000 * 10**18
        ));
        token.purchaseTokens{value: ethAmount}();
    }
    
    function testClawbackTokens() public {
        // First purchase some tokens
        vm.deal(investorA, 10 ether);
        vm.prank(investorA);
        token.purchaseTokens{value: 10 ether}();
        
        uint256 balance = token.balanceOf(investorA);
        uint256 clawbackAmount = balance / 2;
        
        // Grant service provider role to the test contract for clawback
        token.grantRole(token.SERVICE_PROVIDER_ROLE(), address(this));
        
        // Expect manager to receive tokens
        address managerAddr = address(complianceManager);
        uint256 beforeManager = token.balanceOf(managerAddr);
        token.clawbackTokens(investorA, clawbackAmount);
        uint256 afterManager = token.balanceOf(managerAddr);
        
        assertEq(token.balanceOf(investorA), balance - clawbackAmount);
        assertEq(afterManager - beforeManager, clawbackAmount);
    }
    
    function testTransferValidation() public {
        // Purchase tokens
        vm.deal(investorA, 10 ether);
        vm.prank(investorA);
        token.purchaseTokens{value: 10 ether}();
        
        // Transfer to whitelisted investor should work
        vm.prank(investorA);
        token.transfer(investorB, 1000 * 10**18);
        
        // Transfer to non-whitelisted should fail
        vm.prank(investorA);
        vm.expectRevert("NotWhitelisted");
        token.transfer(nonWhitelisted, 1000 * 10**18);
    }
    
    function testPropertyInfo() public {
        (string memory name, string memory location, uint256 totalValue, uint256 price) = token.getPropertyInfo();
        
        assertEq(name, "Test Property");
        assertEq(location, "Test Location");
        assertEq(totalValue, 1000000);
        assertEq(price, 0.001 ether);
    }
}
