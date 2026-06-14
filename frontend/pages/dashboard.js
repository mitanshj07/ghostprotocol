import { useCallback, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import CheckInButton from "../components/CheckInButton";
import CountdownTimer from "../components/CountdownTimer";
import SecretVault from "../components/SecretVault";
import MessageVault from "../components/MessageVault";
import GuardianPanel from "../components/GuardianPanel";
import BeneficiaryList from "../components/BeneficiaryList";
import { getBrowserProvider, getVaultContract, parseVaultInfo, shortAddress } from "../lib/contract";

export default function Dashboard() {
  const [account, setAccount] = useState("");
  const [vault, setVault] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [checkedWallet, setCheckedWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [actionError, setActionError] = useState("");
  const [tab, setTab] = useState("secrets");

  const loadVault = useCallback(async () => {
    try {
      setError("");
      setStatus("Loading vault...");
      setIsLoading(true);
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      setCheckedWallet(true);

      const contract = await getVaultContract(false);
      const exists = await contract.hasVault(address);
      if (!exists) {
        setVault(null);
        setBeneficiaries([]);
        setGuardians([]);
        setMessages([]);
        setStatus("No vault found for this wallet.");
        return;
      }

      const [info, beneficiaryRows, guardianRows, messageRows] = await Promise.all([
        contract.getVaultInfo(address),
        contract.getBeneficiaries(address),
        contract.getGuardians(address),
        contract.getMessages(address)
      ]);

      setVault(parseVaultInfo(info));
      setBeneficiaries(beneficiaryRows);
      setGuardians(guardianRows);
      setMessages(messageRows);
      setStatus("");
    } catch (caught) {
      setVault(null);
      setError(caught.message || "Unable to load vault");
      setStatus("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function deposit() {
    const amount = depositAmount.trim();
    if (!amount || Number(amount) <= 0) {
      setActionError("Enter an ETH amount greater than zero.");
      return;
    }

    try {
      setActionError("");
      setActionStatus("Submitting deposit transaction...");
      setIsMutating(true);
      const value = ethers.parseEther(amount);
      const contract = await getVaultContract(true);
      const tx = await contract.depositETH({ value });
      setActionStatus("Waiting for deposit confirmation...");
      await tx.wait();
      setDepositAmount("");
      setActionStatus("Deposit confirmed.");
      await loadVault();
    } catch (caught) {
      setActionError(caught.shortMessage || caught.reason || caught.message || "Deposit failed.");
      setActionStatus("");
    } finally {
      setIsMutating(false);
    }
  }

  async function trigger() {
    if (!account) {
      setActionError("Connect a wallet before executing a vault stage.");
      return;
    }

    try {
      setActionError("");
      setActionStatus("Submitting stage execution transaction...");
      setIsMutating(true);
      const contract = await getVaultContract(true);
      const tx = await contract.triggerExecution(account);
      setActionStatus("Waiting for execution confirmation...");
      await tx.wait();
      setActionStatus("Stage execution confirmed.");
      await loadVault();
    } catch (caught) {
      setActionError(caught.shortMessage || caught.reason || caught.message || "Stage execution failed.");
      setActionStatus("");
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand small-brand">GHOSTPROTOCOL</Link>
        <div className="action-row">
          <button className="button" onClick={loadVault} disabled={isLoading}>
            {isLoading ? "Connecting" : "Connect"}
          </button>
          <Link className="button" href="/setup">Setup</Link>
        </div>
      </header>

      {status && <p className="muted">{status}</p>}
      {error && <p className="danger small">{error}</p>}

      {!vault && !checkedWallet && (
        <section className="dashboard-empty">
          <div className="dashboard-intro">
            <div className="eyebrow">Vault dashboard</div>
            <h1>Connect your wallet to load your GhostVault.</h1>
            <p className="muted">Your live vault state, countdown, beneficiaries, guardians, and encrypted message controls appear here after connection.</p>
            <div className="action-row">
              <button className="button primary" onClick={loadVault} disabled={isLoading}>
                {isLoading ? "Connecting" : "Connect wallet"}
              </button>
              <Link className="button" href="/setup">Create vault</Link>
            </div>
          </div>

          <div className="dashboard-summary">
            <section className="panel">
              <div className="section-title">Sepolia vault</div>
              <div className="kv"><span>Contract</span><b>0x50d3...9E69</b></div>
              <div className="kv"><span>Verifier</span><b>0x0181...60aB</b></div>
              <div className="kv"><span>Network</span><b>Sepolia</b></div>
            </section>
            <section className="panel">
              <div className="section-title">Control surface</div>
              <div className="status-grid">
                <span>Countdown</span>
                <span>Check-in</span>
                <span>Beneficiaries</span>
                <span>Guardians</span>
                <span>Messages</span>
                <span>Execution</span>
              </div>
            </section>
          </div>
        </section>
      )}

      {!vault && checkedWallet && (
        <section className="dashboard-empty">
          <div className="dashboard-intro">
            <div className="eyebrow">No vault found</div>
            <h1>{account ? shortAddress(account) : "This wallet"} has no active GhostVault.</h1>
            <p className="muted">Create a vault to activate the countdown, ZK check-ins, beneficiaries, guardians, and message vault.</p>
            <div className="action-row">
              <Link className="button primary" href="/setup">Create vault</Link>
              <button className="button" onClick={loadVault} disabled={isLoading}>Refresh</button>
            </div>
          </div>
        </section>
      )}

      {vault && (
        <>
          <section className="dashboard-grid">
            <div className="left-column">
              <CountdownTimer
                secondsUntilTrigger={vault.secondsUntilTrigger}
                totalWindow={vault.checkInWindow}
                triggered={vault.triggered}
              />
              <CheckInButton onSuccess={loadVault} />
              <div className="panel">
                <div className="kv"><span>Vault balance</span><b>{ethers.formatEther(vault.ethBalance)} ETH</b></div>
                <label className="field">
                  Deposit amount
                  <div className="inline-form">
                    <input
                      className="input"
                      inputMode="decimal"
                      min="0"
                      placeholder="0.05"
                      type="number"
                      value={depositAmount}
                      onChange={(event) => setDepositAmount(event.target.value)}
                    />
                    <button className="button" disabled={isMutating} onClick={deposit}>
                      {isMutating ? "Pending" : "Deposit ETH"}
                    </button>
                  </div>
                </label>
                {actionStatus && <p className="small muted">{actionStatus}</p>}
                {actionError && <p className="small danger">{actionError}</p>}
              </div>
            </div>

            <div className="right-column">
              <section className="panel">
                <div className="section-title">Vault status</div>
                <div className="kv"><span>Owner</span><b>{shortAddress(account)}</b></div>
                <div className="kv"><span>State</span><b>{["Active", "Triggered", "Executed"][vault.state]}</b></div>
                <div className="kv"><span>Stage</span><b>{vault.stage}</b></div>
                <button className="button" disabled={isMutating} onClick={trigger}>
                  {isMutating ? "Transaction pending" : "Execute next stage"}
                </button>
              </section>
              <section className="panel">
                <div className="section-title">Beneficiaries</div>
                <BeneficiaryList beneficiaries={beneficiaries} />
              </section>
            </div>
          </section>

          <section className="tabs">
            {["secrets", "messages", "guardians"].map((item) => (
              <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>
            ))}
          </section>
          {tab === "secrets" && <SecretVault />}
          {tab === "messages" && <MessageVault messages={messages} onChange={loadVault} />}
          {tab === "guardians" && <GuardianPanel guardians={guardians} onChange={loadVault} />}
        </>
      )}
    </main>
  );
}
