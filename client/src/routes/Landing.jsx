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
    <main>
      {/* ---- top bar ---- */}
      <div>
        <Link to="/" aria-label="Chase">
          <img src="/brand/chase-mark-on-dark.svg" alt="" />
          <span>Chase</span>
        </Link>
        <Link to="/login">Sign in</Link>
      </div>

      {/* ---- hero ---- */}
      <section>
        <h1>Nothing about your work gets deleted from the story.</h1>
        <p>
          Most task apps forget what you didn't finish. Chase keeps it — what got done, what
          slipped, what you dropped, and why — so the patterns are still there when you look
          back.
        </p>

        <div>
          <Button to="/signup" size="lg">
            Start tracking
          </Button>
          <Link to="/login">I already have an account</Link>
        </div>

        <div>
          <LifecycleDemo />
        </div>
      </section>

      {/* ---- ledger proof ---- */}
      <section>
        <h2>Every task keeps its own record.</h2>
        <div>
          {LEDGER_ROWS.map((row) => (
            <div key={row.title}>
              <div>
                <p>{row.title}</p>
                <span>{row.status}</span>
              </div>
              <p>{row.meta}</p>
              {row.note && <p>{row.note}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ---- promises ---- */}
      <section>
        <h2>Built for the moment work slips, not just the moment it's done.</h2>
        <div>
          {PROMISES.map((item) => (
            <div key={item.title}>
              <p>{item.title}</p>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- final CTA ---- */}
      <section>
        <h2>Start keeping the record.</h2>
        <div>
          <Button to="/signup" size="lg">
            Create your account
          </Button>
        </div>

        <div>
          <img src="/brand/chase-mark-on-dark.svg" alt="" />
          <p>Built to remember, not to judge.</p>
        </div>
      </section>
    </main>
  );
}
