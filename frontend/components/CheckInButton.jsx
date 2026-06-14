import { useState } from "react";
import { generateLivenessProof, generateNonce, verifyProofLocally } from "../lib/zkProof";
import { getVaultContract } from "../lib/contract";

export default function CheckInButton({ onSuccess }) {
  const [passphrase, setPassphrase] = useState("");
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleCheckIn() {
    if (!passphrase) {
      setError("Enter your passphrase");
      return;
    }

    try {
      setError("");
      setTxHash("");
      setState("generating");

      const proofData = await generateLivenessProof(passphrase, generateNonce());

      setState("verifying");
      const valid = await verifyProofLocally(proofData.proof, proofData.publicSignals);
      if (!valid) {
        throw new Error("Generated proof failed local verification");
      }

      setState("submitting");
      const contract = await getVaultContract(true);
      const tx = await contract.submitLivenessProof(
        proofData.pA,
        proofData.pB,
        proofData.pC,
        proofData.pubSignals
      );
      setTxHash(tx.hash);
      await tx.wait();

      setPassphrase("");
      setState("success");
      onSuccess?.(tx.hash);
    } catch (caught) {
      if (process.env.NODE_ENV !== "production") {
        console.error(caught);
      }
      setError(caught.message || "Check-in failed");
      setState("error");
    }
  }

  const label = {
    idle: "Submit liveness proof",
    generating: "Generating ZK proof",
    verifying: "Verifying proof locally",
    submitting: "Submitting transaction",
    success: "Verified alive",
    error: "Try check-in again"
  }[state];

  return (
    <section className={`panel checkin checkin-${state}`}>
      <div className="eyebrow">Weekly liveness proof</div>
      <p className="muted">Your passphrase stays in this browser. The chain only receives a proof and public signals.</p>
      <input
        className="input"
        type="password"
        placeholder="Secret passphrase"
        value={passphrase}
        onChange={(event) => setPassphrase(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && handleCheckIn()}
      />
      <button className="button primary" disabled={state === "generating" || state === "verifying" || state === "submitting"} onClick={handleCheckIn}>
        {label}
      </button>
      {error && <p className="danger small">{error}</p>}
      {txHash && (
        <a className="small link" href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
          View transaction
        </a>
      )}
    </section>
  );
}
