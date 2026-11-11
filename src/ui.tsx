import type { Usage } from './types';

export const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
export const Pill = ({ code, children }: { code: string; children: React.ReactNode }) => <span className={`pill ${code}`}>{children}</span>;
export const Head = ({ title, sub }: { title: string; sub?: string }) => <div className="top"><h2>{title}</h2>{sub && <p>{sub}</p>}</div>;
export const Status = ({ loading, error }: { loading: boolean; error: string }) =>
  error ? <p className="err">{error}</p> : loading ? <p className="muted">Loading…</p> : null;

export function Meter({ u }: { u: Usage }) {
  if (u.limit === null) return <small>{u.used} downloads · unlimited*</small>;
  const r = u.used / u.limit;
  return (
    <>
      <div className={`bar ${r >= 1 ? 'full' : r < 0.5 ? 'low' : ''}`}><i style={{ width: `${Math.min(100, r * 100)}%` }} /></div>
      <small>{u.used} / {u.limit} {u.period === 'month' ? 'this month' : 'lifetime'}</small>
    </>
  );
}

export const size = (b: number | null) => (b ? `${(b / 1048576).toFixed(1)} MB` : '');
export function Cover({ t, locked }: { t: { title: string; cover_url: string | null }; locked?: boolean }) {
  return (
    <div className="cvr" style={t.cover_url ? { backgroundImage: `url(${t.cover_url})` } : undefined}>
      {!t.cover_url && <><small>LUMIBOOK</small><b>{t.title}</b></>}
      {locked && <div className="lock">🔒</div>}
    </div>
  );
}
export function Pager({ page, last, onPage }: { page: number; last: number; onPage(p: number): void }) {
  if (last <= 1) return null;
  return (
    <div className="row pager">
      <button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="muted">Page {page} of {last}</span>
      <button className="btn" disabled={page >= last} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}
