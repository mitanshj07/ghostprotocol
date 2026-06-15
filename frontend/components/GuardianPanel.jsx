import { useState } from "react";
import { getVaultContract, shortAddress, parseWeb3Error } from "../lib/contract";

export default function GuardianPanel({ guardians = [], onChange }) {
  const [guardian, setGuardian] = useState("");
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function addGuardian() {
    setStatus("Submitting guardian transaction...");
    setError("");
    try {
      const contract = await getVaultContract(true);
      const tx = await contract.addGuardian(guardian, hash);
      await tx.wait();
      setGuardian("");
      setHash("");
      setStatus("Guardian added.");
      onChange?.();
    } catch (caught) {
      setStatus("");
      setError(parseWeb3Error(caught, "Guardian add failed"));
    }
  }

  return (
    <section className="panel">
      <div className="section-title">Guardians</div>
      <div className="stack">
        {guardians.map((entry, index) => (
          <div className="row" key={`${entry.wallet}-${index}`}>
            <div>
              <strong>{shortAddress(entry.wallet)}</strong>
              <span>{entry.confirmed ? "Confirmed" : "Pending"}</span>
            </div>
            <span className="small">{entry.shardIpfsHash}</span>
          </div>
        ))}
      </div>
      <div className="form-grid">
        <input className="input" value={guardian} onChange={(event) => setGuardian(event.target.value)} placeholder="Guardian address" />
        <input className="input" value={hash} onChange={(event) => setHash(event.target.value)} placeholder="Encrypted shard IPFS hash" />
        <button className="button" onClick={addGuardian}>Add guardian</button>
      </div>
      {status && <p className="small muted">{status}</p>}
      {error && <div className="crazy-error">{error}</div>}
    </section>
  );
}
