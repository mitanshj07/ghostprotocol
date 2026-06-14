// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IGhostVault.sol";
import "./interfaces/ILivenessVerifier.sol";

contract GhostVault is ReentrancyGuard, IGhostVault {
    using SafeERC20 for IERC20;

    struct Vault {
        address owner;
        uint256 commitment;
        uint256 checkInWindow;
        uint256 lastCheckIn;
        uint256 createdAt;
        VaultState state;
        ExecutionStage stage;
        Beneficiary[] beneficiaries;
        Guardian[] guardians;
        MessageEntry[] messages;
        uint256 ethBalance;
        address[] tokenList;
        mapping(address => bool) tokenKnown;
        mapping(address => uint256) tokenBalances;
        mapping(uint256 => bool) usedNullifiers;
        string metadataIpfsHash;
    }

    ILivenessVerifier public immutable verifier;

    mapping(address => Vault) private vaults;
    mapping(address => bool) public hasVault;

    uint256 public constant STAGE1_DELAY = 1 days;
    uint256 public constant STAGE2_DELAY = 7 days;
    uint256 public constant STAGE3_DELAY = 30 days;
    uint256 public constant STAGE4_DELAY = 90 days;

    event VaultCreated(address indexed owner, uint256 commitment, uint256 checkInWindow);
    event CheckInSubmitted(address indexed owner, uint256 nullifier, uint256 timestamp);
    event VaultTriggered(address indexed owner, uint256 triggeredAt);
    event StageExecuted(address indexed owner, ExecutionStage stage);
    event BeneficiaryPaid(address indexed owner, address indexed beneficiary, uint256 amount);
    event TokenBeneficiaryPaid(address indexed owner, address indexed token, address indexed beneficiary, uint256 amount);
    event MessageRevealed(address indexed owner, address indexed recipient, string ipfsHash);
    event GuardianAdded(address indexed owner, address indexed guardian);
    event GuardianConfirmed(address indexed guardian, address indexed vaultOwner);
    event MessageAdded(address indexed owner, address indexed recipient, string encryptedIpfsHash);
    event EthDeposited(address indexed owner, uint256 amount);
    event TokenDeposited(address indexed owner, address indexed token, uint256 amount);

    modifier onlyVaultOwner() {
        require(hasVault[msg.sender], "No vault found");
        require(vaults[msg.sender].owner == msg.sender, "Not owner");
        require(vaults[msg.sender].state == VaultState.Active, "Vault not active");
        _;
    }

    modifier vaultExists(address owner) {
        require(hasVault[owner], "Vault does not exist");
        _;
    }

    constructor(address verifierAddress) {
        require(verifierAddress != address(0), "Invalid verifier");
        verifier = ILivenessVerifier(verifierAddress);
    }

    function createVault(
        uint256 commitment,
        uint256 checkInWindowDays,
        Beneficiary[] calldata beneficiaries,
        string calldata metadataIpfsHash
    ) external payable {
        require(!hasVault[msg.sender], "Vault already exists");
        require(commitment != 0, "Invalid commitment");
        require(checkInWindowDays >= 1 && checkInWindowDays <= 365, "Window must be 1-365 days");
        require(beneficiaries.length > 0 && beneficiaries.length <= 10, "1-10 beneficiaries required");

        uint256 totalPct;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            require(beneficiaries[i].wallet != address(0), "Invalid beneficiary");
            require(beneficiaries[i].wallet != msg.sender, "Cannot be own beneficiary");
            require(beneficiaries[i].percentage > 0, "Invalid percentage");
            totalPct += beneficiaries[i].percentage;
        }
        require(totalPct == 100, "Percentages must sum to 100");

        Vault storage vault = vaults[msg.sender];
        vault.owner = msg.sender;
        vault.commitment = commitment;
        vault.checkInWindow = checkInWindowDays * 1 days;
        vault.lastCheckIn = block.timestamp;
        vault.createdAt = block.timestamp;
        vault.state = VaultState.Active;
        vault.stage = ExecutionStage.None;
        vault.ethBalance = msg.value;
        vault.metadataIpfsHash = metadataIpfsHash;

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            vault.beneficiaries.push(beneficiaries[i]);
        }

        hasVault[msg.sender] = true;

        emit VaultCreated(msg.sender, commitment, checkInWindowDays * 1 days);
        if (msg.value > 0) {
            emit EthDeposited(msg.sender, msg.value);
        }
    }

    function submitLivenessProof(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256[2] calldata pubSignals
    ) external onlyVaultOwner {
        Vault storage vault = vaults[msg.sender];
        uint256 commitment = pubSignals[0];
        uint256 nullifier = pubSignals[1];

        require(commitment == vault.commitment, "Commitment mismatch");
        require(!vault.usedNullifiers[nullifier], "Proof already used");
        require(verifier.verifyProof(pA, pB, pC, pubSignals), "Invalid ZK proof");

        vault.usedNullifiers[nullifier] = true;
        vault.lastCheckIn = block.timestamp;

        emit CheckInSubmitted(msg.sender, nullifier, block.timestamp);
    }

    function depositETH() external payable onlyVaultOwner {
        require(msg.value > 0, "No ETH sent");
        vaults[msg.sender].ethBalance += msg.value;
        emit EthDeposited(msg.sender, msg.value);
    }

    function depositToken(address token, uint256 amount) external onlyVaultOwner {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");

        Vault storage vault = vaults[msg.sender];
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        vault.tokenBalances[token] += amount;

        if (!vault.tokenKnown[token]) {
            vault.tokenKnown[token] = true;
            vault.tokenList.push(token);
        }

        emit TokenDeposited(msg.sender, token, amount);
    }

    function addGuardian(address guardian, string calldata shardIpfsHash) external onlyVaultOwner {
        require(guardian != address(0), "Invalid guardian");
        require(guardian != msg.sender, "Cannot be own guardian");
        require(bytes(shardIpfsHash).length > 0, "Missing shard hash");
        require(vaults[msg.sender].guardians.length < 7, "Maximum 7 guardians");

        vaults[msg.sender].guardians.push(Guardian({
            wallet: guardian,
            shardIpfsHash: shardIpfsHash,
            confirmed: false
        }));

        emit GuardianAdded(msg.sender, guardian);
    }

    function confirmGuardianRole(address vaultOwner) external vaultExists(vaultOwner) {
        Vault storage vault = vaults[vaultOwner];
        for (uint256 i = 0; i < vault.guardians.length; i++) {
            if (vault.guardians[i].wallet == msg.sender) {
                vault.guardians[i].confirmed = true;
                emit GuardianConfirmed(msg.sender, vaultOwner);
                return;
            }
        }
        revert("Not a guardian");
    }

    function addMessage(address recipient, string calldata encryptedIpfsHash) external onlyVaultOwner {
        require(recipient != address(0), "Invalid recipient");
        require(bytes(encryptedIpfsHash).length > 0, "Missing message hash");
        require(vaults[msg.sender].messages.length < 20, "Maximum 20 messages");

        vaults[msg.sender].messages.push(MessageEntry({
            recipient: recipient,
            encryptedIpfsHash: encryptedIpfsHash,
            revealed: false
        }));

        emit MessageAdded(msg.sender, recipient, encryptedIpfsHash);
    }

    function isTriggered(address owner) public view vaultExists(owner) returns (bool) {
        Vault storage vault = vaults[owner];
        if (vault.state != VaultState.Active) {
            return true;
        }
        return block.timestamp > vault.lastCheckIn + vault.checkInWindow;
    }

    function getTimeSinceMissed(address owner) public view vaultExists(owner) returns (uint256) {
        if (!isTriggered(owner)) {
            return 0;
        }

        Vault storage vault = vaults[owner];
        return block.timestamp - (vault.lastCheckIn + vault.checkInWindow);
    }

    function triggerExecution(address owner) external {
        ExecutionStage stage = nextExecutableStage(owner);
        require(stage != ExecutionStage.None, "No stage executable");

        if (stage == ExecutionStage.Stage1) {
            _executeStage1(owner);
        } else if (stage == ExecutionStage.Stage2) {
            _executeStage2(owner);
        } else if (stage == ExecutionStage.Stage3) {
            _executeStage3(owner);
        } else if (stage == ExecutionStage.Stage4) {
            _executeStage4(owner);
        }
    }

    function executeStage1(address owner) external nonReentrant {
        _executeStage1(owner);
    }

    function executeStage2(address owner) external nonReentrant {
        _executeStage2(owner);
    }

    function executeStage3(address owner) external nonReentrant {
        _executeStage3(owner);
    }

    function executeStage4(address owner) external nonReentrant {
        _executeStage4(owner);
    }

    function nextExecutableStage(address owner) public view vaultExists(owner) returns (ExecutionStage) {
        if (!isTriggered(owner)) {
            return ExecutionStage.None;
        }

        Vault storage vault = vaults[owner];
        uint256 timeSince = getTimeSinceMissed(owner);

        if (vault.stage == ExecutionStage.None && timeSince >= STAGE1_DELAY) {
            return ExecutionStage.Stage1;
        }
        if (vault.stage == ExecutionStage.Stage1 && timeSince >= STAGE2_DELAY) {
            return ExecutionStage.Stage2;
        }
        if (vault.stage == ExecutionStage.Stage2 && timeSince >= STAGE3_DELAY) {
            return ExecutionStage.Stage3;
        }
        if (vault.stage == ExecutionStage.Stage3 && timeSince >= STAGE4_DELAY) {
            return ExecutionStage.Stage4;
        }

        return ExecutionStage.None;
    }

    function _executeStage1(address owner) private vaultExists(owner) {
        require(isTriggered(owner), "Vault not triggered yet");
        Vault storage vault = vaults[owner];
        require(vault.stage == ExecutionStage.None, "Stage 1 already done");
        require(getTimeSinceMissed(owner) >= STAGE1_DELAY, "Stage 1 delay not met");

        vault.stage = ExecutionStage.Stage1;
        vault.state = VaultState.Triggered;

        emit VaultTriggered(owner, block.timestamp);
        emit StageExecuted(owner, ExecutionStage.Stage1);
    }

    function _executeStage2(address owner) private vaultExists(owner) {
        Vault storage vault = vaults[owner];
        require(vault.stage == ExecutionStage.Stage1, "Stage 1 required first");
        require(getTimeSinceMissed(owner) >= STAGE2_DELAY, "Stage 2 delay not met");

        vault.stage = ExecutionStage.Stage2;

        for (uint256 i = 0; i < vault.messages.length; i++) {
            vault.messages[i].revealed = true;
            emit MessageRevealed(owner, vault.messages[i].recipient, vault.messages[i].encryptedIpfsHash);
        }

        emit StageExecuted(owner, ExecutionStage.Stage2);
    }

    function _executeStage3(address owner) private vaultExists(owner) {
        Vault storage vault = vaults[owner];
        require(vault.stage == ExecutionStage.Stage2, "Stage 2 required first");
        require(getTimeSinceMissed(owner) >= STAGE3_DELAY, "Stage 3 delay not met");

        vault.stage = ExecutionStage.Stage3;
        _distributeETH(owner, vault);
        _distributeTokens(owner, vault);

        emit StageExecuted(owner, ExecutionStage.Stage3);
    }

    function _executeStage4(address owner) private vaultExists(owner) {
        Vault storage vault = vaults[owner];
        require(vault.stage == ExecutionStage.Stage3, "Stage 3 required first");
        require(getTimeSinceMissed(owner) >= STAGE4_DELAY, "Stage 4 delay not met");

        vault.stage = ExecutionStage.Stage4;
        vault.state = VaultState.Executed;

        emit StageExecuted(owner, ExecutionStage.Stage4);
    }

    function _distributeETH(address owner, Vault storage vault) private {
        uint256 ethToDistribute = vault.ethBalance;
        vault.ethBalance = 0;

        uint256 paid;
        for (uint256 i = 0; i < vault.beneficiaries.length; i++) {
            Beneficiary memory b = vault.beneficiaries[i];
            uint256 amount = i == vault.beneficiaries.length - 1
                ? ethToDistribute - paid
                : (ethToDistribute * b.percentage) / 100;
            paid += amount;

            if (amount > 0) {
                (bool ok,) = payable(b.wallet).call{value: amount}("");
                require(ok, "ETH transfer failed");
                emit BeneficiaryPaid(owner, b.wallet, amount);
            }
        }
    }

    function _distributeTokens(address owner, Vault storage vault) private {
        for (uint256 tokenIndex = 0; tokenIndex < vault.tokenList.length; tokenIndex++) {
            address token = vault.tokenList[tokenIndex];
            uint256 tokenAmount = vault.tokenBalances[token];
            vault.tokenBalances[token] = 0;

            uint256 paid;
            for (uint256 i = 0; i < vault.beneficiaries.length; i++) {
                Beneficiary memory b = vault.beneficiaries[i];
                uint256 amount = i == vault.beneficiaries.length - 1
                    ? tokenAmount - paid
                    : (tokenAmount * b.percentage) / 100;
                paid += amount;

                if (amount > 0) {
                    IERC20(token).safeTransfer(b.wallet, amount);
                    emit TokenBeneficiaryPaid(owner, token, b.wallet, amount);
                }
            }
        }
    }

    function revealMessage(address vaultOwner)
        external
        view
        vaultExists(vaultOwner)
        returns (string memory ipfsHash)
    {
        Vault storage vault = vaults[vaultOwner];
        for (uint256 i = 0; i < vault.messages.length; i++) {
            MessageEntry storage message = vault.messages[i];
            if (message.recipient == msg.sender && message.revealed) {
                return message.encryptedIpfsHash;
            }
        }
        revert("No revealed message");
    }

    function getVaultInfo(address owner)
        external
        view
        vaultExists(owner)
        returns (
            uint256 commitment,
            uint256 checkInWindow,
            uint256 lastCheckIn,
            VaultState state,
            ExecutionStage stage,
            uint256 ethBalance,
            uint256 createdAt,
            bool triggered,
            uint256 secondsUntilTrigger,
            string memory metadataIpfsHash
        )
    {
        Vault storage vault = vaults[owner];
        bool triggered_ = isTriggered(owner);
        uint256 secondsUntilTrigger_ = 0;
        if (!triggered_) {
            uint256 triggerTime = vault.lastCheckIn + vault.checkInWindow;
            secondsUntilTrigger_ = triggerTime > block.timestamp ? triggerTime - block.timestamp : 0;
        }

        return (
            vault.commitment,
            vault.checkInWindow,
            vault.lastCheckIn,
            vault.state,
            vault.stage,
            vault.ethBalance,
            vault.createdAt,
            triggered_,
            secondsUntilTrigger_,
            vault.metadataIpfsHash
        );
    }

    function getBeneficiaries(address owner) external view vaultExists(owner) returns (Beneficiary[] memory) {
        return vaults[owner].beneficiaries;
    }

    function getGuardians(address owner) external view vaultExists(owner) returns (Guardian[] memory) {
        return vaults[owner].guardians;
    }

    function getMessages(address owner) external view vaultExists(owner) returns (MessageEntry[] memory) {
        return vaults[owner].messages;
    }

    function getMessageCount(address owner) external view vaultExists(owner) returns (uint256) {
        return vaults[owner].messages.length;
    }

    function getTokenBalance(address owner, address token) external view vaultExists(owner) returns (uint256) {
        return vaults[owner].tokenBalances[token];
    }

    receive() external payable {
        require(hasVault[msg.sender], "Use depositETH");
        vaults[msg.sender].ethBalance += msg.value;
        emit EthDeposited(msg.sender, msg.value);
    }
}
