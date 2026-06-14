import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { generateCommitment } from "../lib/zkProof";
import { getVaultContract } from "../lib/contract";

const windows = [7, 30, 90];

export default function VaultSetup() {
  const [step, setStep] = useState(1);
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [commitment, setCommitment] = useState("");
  const [beneficiaries, setBeneficiaries] = useState([{ wallet: "", name: "", percentage: 100 }]);
  const [checkInWindow, setCheckInWindow] = useState(7);
  const [deposit, setDeposit] = useState("0");
  const [status, setStatus] = useState("");

  const totalPercentage = useMemo(
    () => beneficiaries.reduce((sum, beneficiary) => sum + Number(beneficiary.percentage || 0), 0),
    [beneficiaries]
  );

  function updateBeneficiary(index, field, value) {
    setBeneficiaries((items) => items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: field === "percentage" ? Number(value) : value } : item
    )));
  }

  async function computeCommitment() {
    if (!passphrase || passphrase !== confirmPassphrase) {
      setStatus("Passphrases must match.");
      return;
    }
    setStatus("Computing Poseidon commitment...");
    setCommitment(await generateCommitment(passphrase));
    setStatus("Commitment ready.");
  }

  async function createVault() {
    setStatus("Submitting vault creation transaction...");
    try {
      const contract = await getVaultContract(true);
      const tx = await contract.createVault(commitment, checkInWindow, beneficiaries, "", {
        value: ethers.parseEther(deposit || "0")
      });
      await tx.wait();
      setStatus(`Vault created: ${tx.hash}`);
    } catch (error) {
      setStatus(error.message || "Vault creation failed");
    }
  }

  return (
    <section className="wizard">
      <div className="wizard-rail">
        {[1, 2, 3, 4, 5].map((item) => (
          <button className={item === step ? "rail-dot active" : "rail-dot"} key={item} onClick={() => setStep(item)}>{item}</button>
        ))}
      </div>

      {step === 1 && (
        <div className="panel">
          <div className="section-title">Connect wallet</div>
          <p className="muted">Connect MetaMask on Sepolia before creating your vault.</p>
          <button className="button primary" onClick={() => getVaultContract(false).then(() => setStatus("Wallet connected."))}>Connect</button>
        </div>
      )}

      {step === 2 && (
        <div className="panel">
          <div className="section-title">Passphrase commitment</div>
          <input className="input" type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder="Secret passphrase" />
          <input className="input" type="password" value={confirmPassphrase} onChange={(event) => setConfirmPassphrase(event.target.value)} placeholder="Confirm passphrase" />
          <button className="button" onClick={computeCommitment}>Generate commitment</button>
          {commitment && <code className="code-line">{commitment}</code>}
        </div>
      )}

      {step === 3 && (
        <div className="panel">
          <div className="section-title">Beneficiaries</div>
          <div className="stack">
            {beneficiaries.map((beneficiary, index) => (
              <div className="beneficiary-editor" key={index}>
                <input className="input" value={beneficiary.name} onChange={(event) => updateBeneficiary(index, "name", event.target.value)} placeholder="Name" />
                <input className="input" value={beneficiary.wallet} onChange={(event) => updateBeneficiary(index, "wallet", event.target.value)} placeholder="Wallet address" />
                <input className="input" type="number" value={beneficiary.percentage} onChange={(event) => updateBeneficiary(index, "percentage", event.target.value)} placeholder="%" />
              </div>
            ))}
          </div>
          <div className="action-row">
            <button className="button" onClick={() => setBeneficiaries([...beneficiaries, { wallet: "", name: "", percentage: 0 }])}>Add</button>
            <span className={totalPercentage === 100 ? "success small" : "warning small"}>Total: {totalPercentage}%</span>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="panel">
          <div className="section-title">Check-in window</div>
          <div className="segmented">
            {windows.map((days) => (
              <button className={checkInWindow === days ? "active" : ""} key={days} onClick={() => setCheckInWindow(days)}>{days} days</button>
            ))}
          </div>
          <div className="timeline">
            <span>Day 1: alerts</span>
            <span>Day 7: messages</span>
            <span>Day 30: funds</span>
            <span>Day 90: final state</span>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="panel">
          <div className="section-title">Review and deploy</div>
          <div className="kv"><span>Window</span><b>{checkInWindow} days</b></div>
          <div className="kv"><span>Beneficiaries</span><b>{beneficiaries.length}</b></div>
          <input className="input" value={deposit} onChange={(event) => setDeposit(event.target.value)} placeholder="ETH deposit" />
          <button className="button primary" disabled={!commitment || totalPercentage !== 100} onClick={createVault}>Create vault</button>
        </div>
      )}

      <div className="action-row">
        <button className="button" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</button>
        <button className="button" disabled={step === 5} onClick={() => setStep(step + 1)}>Next</button>
      </div>
      {status && <p className="small muted">{status}</p>}
    </section>
  );
}
