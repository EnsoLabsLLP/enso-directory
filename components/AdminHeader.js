"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";

export default function AdminHeader() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <header className="a-top">
      <div className="a-wrap a-bar">
        <Link href="/admin" className="a-brand">
          <img src="/enso-logo.png" alt="Enso Labs" />
          <span>Admin</span>
        </Link>
        <nav className="a-nav">
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn ghost sm"><Icon name="external-link" />View site</a>
          <button type="button" className="btn ghost sm" onClick={logout}><Icon name="logout" />Log out</button>
        </nav>
      </div>
    </header>
  );
}
