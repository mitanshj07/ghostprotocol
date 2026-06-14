// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILivenessVerifier {
    function verifyProof(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256[2] calldata pubSignals
    ) external view returns (bool);
}
