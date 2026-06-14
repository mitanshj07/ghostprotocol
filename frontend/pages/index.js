import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="brand">GHOSTPROTOCOL</div>
            <h1>Your legacy, cryptographically enforced.</h1>
            <p>A dead man's switch for the blockchain. Prove you are alive on schedule. If you stop, your vault moves through deterministic on-chain execution.</p>
            <div className="action-row">
              <Link className="button primary" href="/setup">Create your vault</Link>
              <Link className="button" href="#how">See how it works</Link>
            </div>
          </div>
          <div className="terminal-scene" aria-hidden="true">
            <div className="terminal-line green">proof.status: valid</div>
            <div className="terminal-line">commitment: poseidon(secret)</div>
            <div className="terminal-line purple">nullifier: fresh</div>
            <div className="terminal-line amber">next_check_in: 6d 23h</div>
            <div className="terminal-line red">execution: locked</div>
          </div>
        </div>
      </section>

      <section className="band stats">
        <span>Unstoppable</span>
        <span>Non-custodial</span>
        <span>Zero-knowledge</span>
        <span>Sepolia-ready</span>
      </section>

      <section className="band" id="how">
        <div className="section-title">How it works</div>
        <div className="grid-four">
          <article className="card"><b>01</b><h2>Create vault</h2><p>Deposit ETH and define beneficiary splits.</p></article>
          <article className="card"><b>02</b><h2>Add guardians</h2><p>Split encrypted recovery shards across trusted people.</p></article>
          <article className="card"><b>03</b><h2>Write messages</h2><p>Store encrypted IPFS pointers for later reveal.</p></article>
          <article className="card"><b>04</b><h2>Check in</h2><p>Submit a ZK proof of passphrase knowledge.</p></article>
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
