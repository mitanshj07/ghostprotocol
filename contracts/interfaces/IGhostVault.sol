// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGhostVault {
    enum VaultState {
        Active,
        Triggered,
        Executed
    }

    enum ExecutionStage {
        None,
        Stage1,
        Stage2,
        Stage3,
        Stage4
    }

    struct Beneficiary {
        address wallet;
        uint8 percentage;
        string name;
    }

    struct Guardian {
        address wallet;
        string shardIpfsHash;
        bool confirmed;
    }

    struct MessageEntry {
        address recipient;
        string encryptedIpfsHash;
        bool revealed;
    }

    function createVault(
        uint256 commitment,
        uint256 checkInWindowDays,
        Beneficiary[] calldata beneficiaries,
        string calldata metadataIpfsHash
    ) external payable;

    function submitLivenessProof(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256[2] calldata pubSignals
    ) external;

    function isTriggered(address owner) external view returns (bool);
    function triggerExecution(address owner) external;
}
