// SPDX-License-Identifier: Apache 2
pragma solidity ^0.8.20;

import {IWormhole} from "./interfaces/IWormhole.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Treasury
 * @dev Treasury contract that receives and verifies messages from Aztec via Wormhole
 * and processes token transfers to recipients
 */
contract Treasury {
    IWormhole public immutable wormhole;

    // Track processed messages to prevent duplicates
    mapping(bytes32 => bool) public processedMessages;
    bytes public lastPayload;

    /**
     * @dev Event emitted when a message is received from Aztec
     * @param emitterChainId The Wormhole chain ID of the emitter (56 for Aztec)
     * @param emitterAddress The emitter contract address
     * @param sequence The sequence number of the message
     * @param payload The message payload
     */
    event MessageReceived(
        uint16 indexed emitterChainId,
        bytes32 indexed emitterAddress,
        uint64 indexed sequence,
        bytes payload
    );

    /**
     * @dev Constructor
     * @param _wormhole Address of the Wormhole contract on Arbitrum
     */
    constructor(address _wormhole) {
        require(_wormhole != address(0), "Wormhole address cannot be zero");
        wormhole = IWormhole(_wormhole);
    }

    /**
     * @notice Receives and verifies a VAA from Aztec
     * @param encodedVm The VAA bytes from Wormhole
     */
    function verify(bytes memory encodedVm) external {
        // Parse and verify the VAA through Wormhole
        (IWormhole.VM memory vm, bool valid, string memory reason) = wormhole
            .parseAndVerifyVM(encodedVm);

        // Ensure the VAA signature is valid
        require(valid, reason);

        // Create unique message ID to prevent duplicates
        bytes32 messageId = keccak256(
            abi.encodePacked(vm.emitterChainId, vm.emitterAddress, vm.sequence)
        );

        // Check if already processed
        require(!processedMessages[messageId], "Message already processed");

        // Mark as processed
        processedMessages[messageId] = true;

        processPayload(vm.payload);

        // Emit event with the message payload
        emit MessageReceived(
            vm.emitterChainId,
            vm.emitterAddress,
            vm.sequence,
            vm.payload
        );

        // The payload contains your message data (8 fields of 31 bytes each = 248 bytes total)
        lastPayload = vm.payload;
    }

    /**
     * @notice Checks if a message has been processed
     * @param emitterChainId The emitter chain ID
     * @param emitterAddress The emitter address
     * @param sequence The sequence number
     * @return bool True if the message has been processed
     */
    function isMessageProcessed(
        uint16 emitterChainId,
        bytes32 emitterAddress,
        uint64 sequence
    ) external view returns (bool) {
        bytes32 messageId = keccak256(
            abi.encodePacked(emitterChainId, emitterAddress, sequence)
        );
        return processedMessages[messageId];
    }

    function processPayload(bytes memory payload) internal {
        // Extract the address from the payload
        require(payload.length >= 104, "Payload too short");

        address tokenAddress;
        address recipientAddress;
        uint256 amount;
        bytes32 tempAmountData;

        assembly {
            // tokenAddress = bytes20(payload[43:63])
            tokenAddress := mload(add(payload, 63))
            // recipientAddress = bytes20(payload[74:94])
            recipientAddress := mload(add(payload, 94))
            // amount = bytes32(payload[94:125])
            tempAmountData := shl(8, mload(add(payload, 125)))
            amount := shr(8, tempAmountData)
        }

        // Transfer the tokens to the recipient
        IERC20(tokenAddress).transfer(recipientAddress, amount);
    }
}
