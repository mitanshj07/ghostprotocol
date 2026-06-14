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
  const [tab, setTab] = useState("secrets");

  const loadVault = useCallback(async () => {
    setStatus("Loading vault...");
    const provider = await getBrowserProvider();
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    setAccount(address);

    const contract = await getVaultContract(false);
    const exists = await contract.hasVault(address);
    if (!exists) {
      setVault(null);
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
  }, []);

  async function deposit() {
    const amount = prompt("ETH to deposit");
    if (!amount) return;
    const contract = await getVaultContract(true);
    const tx = await contract.depositETH({ value: ethers.parseEther(amount) });
    await tx.wait();
    await loadVault();
  }

  async function trigger() {
    const contract = await getVaultContract(true);
    const tx = await contract.triggerExecution(account);
    await tx.wait();
    await loadVault();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand small-brand">GHOSTPROTOCOL</Link>
        <div className="action-row">
          <button className="button" onClick={loadVault}>Connect</button>
          <Link className="button" href="/setup">Setup</Link>
        </div>
      </header>

      {status && <p className="muted">{status}</p>}

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
                <button className="button" onClick={deposit}>Deposit ETH</button>
              </div>
            </div>

            <div className="right-column">
              <section className="panel">
                <div className="section-title">Vault status</div>
                <div className="kv"><span>Owner</span><b>{shortAddress(account)}</b></div>
                <div className="kv"><span>State</span><b>{["Active", "Triggered", "Executed"][vault.state]}</b></div>
                <div className="kv"><span>Stage</span><b>{vault.stage}</b></div>
                <button className="button" onClick={trigger}>Execute next stage</button>
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
