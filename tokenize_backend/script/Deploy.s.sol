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

        vm.startBroadcast(deployerKey);

        // 1) Deploy ComplianceManager with a temporary token address
        ComplianceManager manager = new ComplianceManager(address(0x1));

        // 2) Deploy RealEstateToken pointing at the manager
        RealEstateToken token = new RealEstateToken(
            "Real Estate Token",
            "RET",
            address(manager)
        );

        // 3) Wire the manager with the actual token address
        manager.setTokenAddress(address(token));

        // 4) Set property info (customize as needed)
        // name, location, totalValue (arbitrary units), tokenPrice (wei)
        token.setPropertyInfo(
            "One Market Plaza",
            "San Francisco, CA",
            200_000_000,
            0.001 ether
        );

        vm.stopBroadcast();

        console2.log("ComplianceManager:", address(manager));
        console2.log("RealEstateToken:", address(token));
    }
}


