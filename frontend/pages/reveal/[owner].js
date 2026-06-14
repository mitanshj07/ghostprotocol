import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";
import { getVaultContract } from "../../lib/contract";

export default function RevealPage() {
  const router = useRouter();
  const { owner } = router.query;
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState("");

  async function reveal() {
    setStatus("Checking message access...");
    try {
      const contract = await getVaultContract(false);
      setHash(await contract.revealMessage(owner));
      setStatus("Message pointer revealed.");
    } catch (error) {
      setStatus(error.message || "Message is not available yet");
    }
  }

  return (
    <main className="app-shell narrow">
      <header className="topbar">
        <Link href="/" className="brand small-brand">GHOSTPROTOCOL</Link>
      </header>
      <section className="panel">
        <div className="section-title">Reveal message</div>
        <p className="muted">Connect the recipient wallet to check whether the vault has released a message for you.</p>
        <button className="button primary" onClick={reveal}>Reveal IPFS pointer</button>
        {hash && <code className="code-line">{hash}</code>}
        {status && <p className="small muted">{status}</p>}
      </section>
    </main>
  );
}
