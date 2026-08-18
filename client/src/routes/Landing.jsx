import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { LifecycleDemo } from '../components/marketing/LifecycleDemo';

const LEDGER_ROWS = [
  {
    title: 'Draft the Q3 pricing memo',
    status: 'Completed',
    color: 'var(--color-completed)',
    meta: 'Wed, 4:12 PM',
    note: null,
  },
  {
    title: 'Confirm venue for the offsite',
    status: 'Needs review',
    color: 'var(--color-review)',
    meta: 'Deadline passed 6h ago',
    note: null,
  },
  {
    title: 'Migrate the onboarding docs',
    status: 'Not done',
    color: 'var(--color-notdone)',
    meta: 'Resolved Tue, 9:40 AM',
    note: 'Got pulled onto an incident. Rescheduled for next sprint.',
  },
  {
    title: 'Old survey draft',
    status: 'Deleted',
    color: 'var(--color-deleted)',
    meta: 'Mon, 11:02 AM',
    note: 'Superseded by the new template.',
  },
];

const PROMISES = [
  {
    title: "MISSED isn't a verdict.",
    body: "A deadline passing just means we haven't heard from you yet. You decide what actually happened — the interface asks, it doesn't accuse.",
  },
  {
    title: 'Everything stays.',
    body: 'Completed, missed, resolved, deleted — every task keeps its history and its reason. Nothing quietly disappears from the record.',
  },
  {
    title: 'Runs from your thumb.',
    body: "Completing, resolving, deleting — every action lives within reach of one hand, because that's how this actually gets used.",
  },
];

export default function Landing() {
  return (
    <main
      className="relative min-h-dvh overflow-hidden"
      style={{
        backgroundColor: 'var(--color-canvas)',
        backgroundImage:
          'radial-gradient(140% 60% at 50% -20%, var(--color-pine-tint) 0%, transparent 55%)',
      }}
    >
      {/* ---- top bar ---- */}
      <div className="flex items-center justify-between px-gutter pt-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Chase">
          <img src="/brand/chase-mark-on-light.svg" alt="" className="h-7 w-7" />
          <span className="text-task text-ink">Chase</span>
        </Link>
        <Link
          to="/login"
          className="rounded-(--radius-sm) px-3 py-2 text-body text-ink-2 transition-colors hover:text-ink"
        >
          Sign in
        </Link>
      </div>

      {/* ---- hero ---- */}
      <section className="flex flex-col items-center px-gutter pt-14 pb-16 text-center">
        <h1 className="max-w-xs text-[2.5rem] leading-[1.08] font-semibold tracking-[-0.03em] text-ink">
          Nothing about your work gets deleted from the story.
        </h1>
        <p className="mt-4 max-w-xs text-body text-ink-2">
          Most task apps forget what you didn't finish. Chase keeps it — what got done, what
          slipped, what you dropped, and why — so the patterns are still there when you look
          back.
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Button to="/signup" size="lg" className="w-full">
            Start tracking
          </Button>
          <Link
            to="/login"
            className="flex h-11 w-full items-center justify-center text-body text-ink-2 transition-colors hover:text-ink"
          >
            I already have an account
          </Link>
        </div>

        <div className="mt-12 w-full">
          <LifecycleDemo />
        </div>
      </section>

      {/* ---- ledger proof ---- */}
      <section className="border-t border-(--border-hairline) px-gutter py-14">
        <h2 className="max-w-xs font-serif text-section text-ink">Every task keeps its own record.</h2>
        <div className="mt-6 flex flex-col">
          {LEDGER_ROWS.map((row, i) => (
            <div
              key={row.title}
              className={`flex flex-col gap-1.5 py-4 ${i > 0 ? 'border-t border-(--border-hairline)' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 text-task text-ink">{row.title}</p>
                <span
                  className="shrink-0 rounded-(--radius-pill) px-2.5 py-1 text-micro"
                  style={{
                    color: row.color,
                    backgroundColor: `color-mix(in srgb, ${row.color} 14%, var(--color-surface))`,
                  }}
                >
                  {row.status}
                </span>
              </div>
              <p className="text-meta text-ink-3">{row.meta}</p>
              {row.note && <p className="text-body text-ink-2">{row.note}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ---- promises ---- */}
      <section className="border-t border-(--border-hairline) px-gutter py-14">
        <h2 className="max-w-xs font-serif text-section text-ink">
          Built for the moment work slips, not just the moment it's done.
        </h2>
        <div className="mt-6 flex flex-col">
          {PROMISES.map((item, i) => (
            <div
              key={item.title}
              className={`py-5 ${i > 0 ? 'border-t border-(--border-hairline)' : ''}`}
            >
              <p className="text-task text-ink">{item.title}</p>
              <p className="mt-1.5 text-body text-ink-2">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- final CTA ---- */}
      <section className="border-t border-(--border-hairline) px-gutter py-16 text-center">
        <h2 className="mx-auto max-w-xs font-serif text-section text-ink">
          Start keeping the record.
        </h2>
        <div className="mx-auto mt-6 max-w-xs">
          <Button to="/signup" size="lg" className="w-full">
            Create your account
          </Button>
        </div>

        <div className="mt-16 flex flex-col items-center gap-2">
          <img src="/brand/chase-mark-on-light.svg" alt="" className="h-6 w-6 opacity-60" />
          <p className="text-meta text-ink-3">Built to remember, not to judge.</p>
        </div>
      </section>
    </main>
  );
}
