import Link from "next/link";
import VaultSetup from "../components/VaultSetup";

export default function SetupPage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand small-brand">GHOSTPROTOCOL</Link>
        <Link href="/dashboard" className="button">Dashboard</Link>
      </header>
      <VaultSetup />
    </main>
  );
}
