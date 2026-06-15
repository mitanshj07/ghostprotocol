import { useCallback, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import CheckInButton from "../components/CheckInButton";
import CountdownTimer from "../components/CountdownTimer";
import SecretVault from "../components/SecretVault";
import MessageVault from "../components/MessageVault";
import GuardianPanel from "../components/GuardianPanel";
import BeneficiaryList from "../components/BeneficiaryList";
import { CONTRACT_ADDRESS, VERIFIER_ADDRESS, getBrowserProvider, getVaultContract, parseVaultInfo, shortAddress, parseWeb3Error } from "../lib/contract";

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
      setError(parseWeb3Error(caught, "Unable to load vault"));
      setStatus("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function deposit() {
    const amount = depositAmount.trim();
    if (!amount || Number(amount) <= 0) {
      setActionError("ZERO BAGS? 🛑 ENTER ETH AMOUNT");
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
      setActionError(parseWeb3Error(caught, "Deposit failed."));
      setActionStatus("");
    } finally {
      setIsMutating(false);
    }
  }

  async function trigger() {
    if (!account) {
      setActionError("NO WALLET CONNECTED 🔌 PLUG IN TO EXECUTE");
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
      setActionError(parseWeb3Error(caught, "Stage execution failed."));
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
          <button className={`button ${account ? "crazy-connected" : ""}`} onClick={loadVault} disabled={isLoading}>
            {isLoading ? "Connecting..." : (account ? `Connected: ${shortAddress(account)}` : "Connect")}
          </button>
          <Link className="button" href="/setup">Setup</Link>
        </div>
      </header>

      {status && <p className="muted">{status}</p>}
      {error && <div className="crazy-error">{error}</div>}

      {!vault && !checkedWallet && (
        <section className="dashboard-empty">
          <div className="dashboard-intro">
            <div className="eyebrow">Vault dashboard</div>
            <h1>Connect wallet. Load vault. Stay un-rugged by time.</h1>
            <p className="muted">Countdowns, ZK check-ins, guardians, beneficiaries, and encrypted payloads in one onchain command center.</p>
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
              <div className="kv"><span>Contract</span><b>{shortAddress(CONTRACT_ADDRESS)}</b></div>
              <div className="kv"><span>Verifier</span><b>{shortAddress(VERIFIER_ADDRESS)}</b></div>
              <div className="kv"><span>Network</span><b>Sepolia</b></div>
            </section>
            <section className="panel">
              <div className="section-title">CT control surface</div>
              <div className="status-grid">
                <span>Countdown: armed</span>
                <span>ZK check-in: private</span>
                <span>Beneficiaries: deterministic</span>
                <span>Guardians: shard gang</span>
                <span>Messages: encrypted</span>
                <span>Execution: no cap</span>
              </div>
            </section>
          </div>
        </section>
      )}

      {!vault && checkedWallet && (
        <section className="dashboard-empty">
          <div className="dashboard-intro">
            <div className="eyebrow">No vault found</div>
            <h1>{account ? shortAddress(account) : "This wallet"} is vaultless rn.</h1>
            <p className="muted">Fresh wallet, no active GhostVault. Create one to arm the countdown, private check-ins, guardians, messages, and staged execution.</p>
            <div className="action-row">
              <Link className="button primary" href="/setup">Create vault</Link>
              <button className="button" onClick={loadVault} disabled={isLoading}>Refresh</button>
            </div>
          </div>
          <div className="dashboard-summary">
            <section className="panel terminal-mini">
              <div className="section-title">Wallet readout</div>
              <div className="terminal-line green">wallet = {account ? shortAddress(account) : "not_connected"}</div>
              <div className="terminal-line amber">vault.status = not_found</div>
              <div className="terminal-line purple">next.move = create_vault</div>
            </section>
            <section className="panel">
              <div className="section-title">What unlocks</div>
              <div className="status-grid">
                <span>ETH deposits</span>
                <span>ZK liveness</span>
                <span>Guardian shards</span>
                <span>Encrypted drops</span>
              </div>
            </section>
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
                {actionError && <div className="crazy-error">{actionError}</div>}
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
