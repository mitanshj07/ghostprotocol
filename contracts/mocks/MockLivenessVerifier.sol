// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockLivenessVerifier {
    bool public valid = true;

    function setValid(bool nextValid) external {
        valid = nextValid;
    }

    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[2] calldata
    ) external view returns (bool) {
        return valid;
    }
}
