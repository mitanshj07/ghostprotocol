import { useMemo, useState } from "react";
import { splitSecret, reconstructSecret } from "../lib/shamir";

export default function SecretVault() {
  const [secret, setSecret] = useState("");
  const [numShards, setNumShards] = useState(5);
  const [threshold, setThreshold] = useState(3);
  const [shards, setShards] = useState([]);

  const preview = useMemo(() => {
    if (shards.length < threshold) return "";
    try {
      return reconstructSecret(shards.slice(0, threshold));
    } catch {
      return "";
    }
  }, [shards, threshold]);

  function split() {
    setShards(splitSecret(secret, numShards, threshold));
  }

  return (
    <section className="panel">
      <div className="section-title">Secret vault</div>
      <textarea className="textarea" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Paste a secret to split locally" />
      <div className="two">
        <label className="field">Total shards
          <input className="input" type="number" min="2" max="7" value={numShards} onChange={(event) => setNumShards(Number(event.target.value))} />
        </label>
        <label className="field">Threshold
          <input className="input" type="number" min="2" max={numShards} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
        </label>
      </div>
      <button className="button" onClick={split} disabled={!secret}>Split secret</button>
      {shards.length > 0 && (
        <div className="stack">
          {shards.map((shard, index) => (
            <code className="code-line" key={shard}>{index + 1}. {shard}</code>
          ))}
          <p className="small muted">Local reconstruction check: {preview === secret ? "passed" : "waiting for threshold"}</p>
        </div>
      )}
    </section>
  );
}
