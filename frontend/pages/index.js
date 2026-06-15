import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="brand">GHOSTPROTOCOL</div>
            <h1>Proof-of-life vaults for the terminally onchain.</h1>
            <p>Your assets do not need vibes. They need cryptographic liveness, timed execution, and a vault that does exactly what you told it to do.</p>
            <div className="action-row">
              <Link className="button primary" href="/setup">Create your vault</Link>
              <Link className="button" href="#how">Open the playbook</Link>
            </div>
          </div>
          <div className="terminal-scene" aria-hidden="true">
            <div className="terminal-kicker">CT TERMINAL // LIVE</div>
            <div className="terminal-line green">proof.status = alive_and_cooking</div>
            <div className="terminal-line purple">commitment = poseidon(secret) // no doxxing</div>
            <div className="terminal-line amber">next_check_in = 6d 23h // touch grass later</div>
            <div className="terminal-line red">execution = locked_until_missed_checkin</div>
            <div className="terminal-line cyan">beneficiaries = pre-signed destiny</div>
          </div>
        </div>
      </section>

      <section className="band stats">
        <span>Non-custodial</span>
        <span>ZK proof-of-life</span>
        <span>Dead-man switch</span>
        <span>Sepolia live</span>
      </section>

      <section className="band" id="how">
        <div className="section-title">How it works</div>
        <div className="grid-four">
          <article className="card"><b>01</b><h2>Mint the vault</h2><p>Deposit ETH and set the split. No spreadsheet archaeology later.</p></article>
          <article className="card"><b>02</b><h2>Assign the squad</h2><p>Guardians hold encrypted recovery shards without seeing the full secret.</p></article>
          <article className="card"><b>03</b><h2>Drop the payload</h2><p>Store encrypted IPFS pointers for messages and instructions.</p></article>
          <article className="card"><b>04</b><h2>Stay alive</h2><p>Check in with a ZK proof. Miss the window and the vault starts moving.</p></article>
        </div>
      </section>

      <section className="band">
        <div className="section-title">Built on</div>
        <div className="tech-strip">
          <span>Circom</span>
          <span>Groth16</span>
          <span>Poseidon</span>
          <span>Solidity</span>
          <span>IPFS</span>
          <span>Shamir SSS</span>
        </div>
      </section>
    </main>
  );
}
