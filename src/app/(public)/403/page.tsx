import Link from "next/link";
export default function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] grid place-content-center p-6 text-center text-white">
      <div className="max-w-lg rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-8">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-white/70">You don’t have permission to view this page.</p>
        <div className="mt-6 inline-flex gap-2">
          <Link href="/" className="rounded-md bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-200">Go home</Link>
          <Link href="/login" className="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
