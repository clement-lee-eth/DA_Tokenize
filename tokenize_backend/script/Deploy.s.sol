// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import {ComplianceManager} from "../src/ComplianceManager.sol";
import {RealEstateToken} from "../src/RealEstateToken.sol";

/**
 * @title Deploy
 * @dev Deploys ComplianceManager and RealEstateToken, wires references, and sets property info.
 */
contract Deploy is Script {
    function run() external {
        // Load broadcaster private key from env (SERVICE_PROVIDER_PK)
        uint256 deployerKey = vm.envUint("SERVICE_PROVIDER_PK");
        address deployerAddr = vm.addr(deployerKey);
        // Optional: UI wallet to grant role to (if different from deployer)
        // Provide UI_WALLET in your .env to auto-grant
        address uiWallet;
        try vm.envAddress("UI_WALLET") returns (address a) { uiWallet = a; } catch { uiWallet = address(0); }

        vm.startBroadcast(deployerKey);

        // 1) Deploy ComplianceManager with a temporary token address
        ComplianceManager manager = new ComplianceManager(address(0x1));

        // 2) Deploy RealEstateToken pointing at the manager
        RealEstateToken token = new RealEstateToken(
            "MBS Token",
            "MBST",
            address(manager)
        );

        // 3) Wire the manager with the actual token address
        manager.setTokenAddress(address(token));

        // 4) Set property info (customize as needed)
        // name, location, totalValue (arbitrary units), tokenPrice (wei)
        token.setPropertyInfo(
            "Marina Bay Sands",
            "Singapore, SG",
            10_000_000,
            0.001 ether
        );

        // 5) Ensure roles are set for deployer and UI wallet
        bytes32 spRole = keccak256("SERVICE_PROVIDER_ROLE");
        if (!manager.hasRole(spRole, deployerAddr)) {
            manager.grantRole(spRole, deployerAddr);
        }
        if (uiWallet != address(0) && !manager.hasRole(spRole, uiWallet)) {
            manager.grantRole(spRole, uiWallet);
        }

        vm.stopBroadcast();

        console2.log("ComplianceManager:", address(manager));
        console2.log("RealEstateToken:", address(token));
        console2.log("Service provider (deployer):", deployerAddr);
        if (uiWallet != address(0)) console2.log("Service provider (UI):", uiWallet);
    }
}


