import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          Bet Analyze
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600">
          <Link href="/" className="hover:text-zinc-900">
            Dashboard
          </Link>
          <Link href="/strategies" className="hover:text-zinc-900">
            Strategies
          </Link>
        </nav>
      </div>
    </header>
  );
}
