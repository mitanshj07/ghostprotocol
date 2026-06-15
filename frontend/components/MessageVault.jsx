import { useState } from "react";
import { getVaultContract, shortAddress, parseWeb3Error } from "../lib/contract";

export default function MessageVault({ messages = [], onChange }) {
  const [recipient, setRecipient] = useState("");
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function addMessage() {
    setStatus("Submitting message pointer...");
    setError("");
    try {
      const contract = await getVaultContract(true);
      const tx = await contract.addMessage(recipient, hash);
      await tx.wait();
      setRecipient("");
      setHash("");
      setStatus("Message pointer stored.");
      onChange?.();
    } catch (caught) {
      setStatus("");
      setError(parseWeb3Error(caught, "Message add failed"));
    }
  }

  return (
    <section className="panel">
      <div className="section-title">Message vault</div>
      <div className="stack">
        {messages.map((message, index) => (
          <div className="row" key={`${message.recipient}-${index}`}>
            <div>
              <strong>{shortAddress(message.recipient)}</strong>
              <span>{message.revealed ? "Revealed" : "Locked"}</span>
            </div>
            <span className="small">{message.encryptedIpfsHash}</span>
          </div>
        ))}
      </div>
      <div className="form-grid">
        <input className="input" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Recipient address" />
        <input className="input" value={hash} onChange={(event) => setHash(event.target.value)} placeholder="Encrypted IPFS hash" />
        <button className="button" onClick={addMessage}>Store message</button>
      </div>
      {status && <p className="small muted">{status}</p>}
      {error && <div className="crazy-error">{error}</div>}
    </section>
  );
}
