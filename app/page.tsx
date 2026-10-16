export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Life Hub</h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Your personal dashboard. Start building in{" "}
        <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
          app/page.tsx
        </code>
      </p>
    </main>
  );
}
