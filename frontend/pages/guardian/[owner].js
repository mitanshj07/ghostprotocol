import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";
import { getVaultContract, parseWeb3Error } from "../../lib/contract";

export default function GuardianPage() {
  const router = useRouter();
  const { owner } = router.query;
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function accept() {
    setStatus("Submitting guardian confirmation...");
    setError("");
    try {
      const contract = await getVaultContract(true);
      const tx = await contract.confirmGuardianRole(owner);
      await tx.wait();
      setStatus("Guardian role confirmed.");
    } catch (caught) {
      setStatus("");
      setError(parseWeb3Error(caught, "Confirmation failed"));
    }
  }

  return (
    <main className="app-shell narrow">
      <header className="topbar">
        <Link href="/" className="brand small-brand">GHOSTPROTOCOL</Link>
      </header>
      <section className="panel">
        <div className="section-title">Guardian acceptance</div>
        <p className="muted">{owner || "A vault owner"} added you as a GhostVault guardian.</p>
        <button className="button primary" onClick={accept}>Accept guardian role</button>
        {status && <p className="small muted">{status}</p>}
        {error && <div className="crazy-error">{error}</div>}
      </section>
    </main>
  );
}
