import { useEffect, useState } from 'react';
import { api, useFetch } from '../../api';
import { Head, Meter, Pill, Status, fmt } from '../../ui';
import type { AdminUser, Paged, UserTrace } from '../../types';

const PLANS: [string, string][] = [['free', 'Free'], ['premium', 'Premium'], ['plus', 'Premium Plus'], ['all', 'All Access']];

export default function Users() {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [plan, setPlan] = useState('');
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => { const t = setTimeout(() => setDq(q), 300); return () => clearTimeout(t); }, [q]);
  const { data, error, loading, reload } = useFetch<Paged<AdminUser>>(`/admin/users?q=${encodeURIComponent(dq)}&plan=${plan}`);

  return (
    <>
      <Head title="Users & plans" sub="See every user, which plan they use, and how much they have used." />
      <div className="tools">
        <input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="">All plans</option>{PLANS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
      </div>
      <Status loading={loading} error={error} />
      {data && (
        <div className="tw"><table>
          <thead><tr><th>User</th><th>Plan</th><th>Downloads</th><th>Titles</th><th>Last download</th><th>Status</th></tr></thead>
          <tbody>
            {data.data.map((u) => (
              <tr key={u.id} className="r" onClick={() => setSel(u.id)}>
                <td><b>{u.name}</b><small>{u.email}</small></td>
                <td><Pill code={u.plan.code}>{u.plan.name}</Pill></td>
                <td><Meter u={u.usage} /></td>
                <td>{u.titles_unlocked}</td>
                <td>{fmt(u.last_download_at)}</td>
                <td><span className={`pill ${u.status === 'active' ? 'ok' : 'bad'}`}>{u.status}</span></td>
              </tr>
            ))}
            {!data.data.length && <tr><td colSpan={6}>No users match.</td></tr>}
          </tbody>
        </table></div>
      )}
      <p className="note">*Unlimited is subject to fair-use and rate limits. Click a row to trace a user.</p>
      {sel !== null && <Drawer id={sel} onClose={() => setSel(null)} onChange={reload} />}
    </>
  );
}

function Drawer({ id, onClose, onChange }: { id: number; onClose(): void; onChange(): void }) {
  const { data, error, loading, reload } = useFetch<UserTrace>(`/admin/users/${id}`);
  const [plan, setPlan] = useState('');
  const [msg, setMsg] = useState('');

  async function act(path: string, body: unknown) {
    setMsg('');
    try { await api(path, { method: 'PUT', body }); reload(); onChange(); setMsg('Saved.'); }
    catch (e) { setMsg((e as Error).message); }
  }
  return (
    <div className="drawer open">
      <div className="row between"><h2>{data?.user.name ?? 'User'}</h2><button className="btn" onClick={onClose}>Close</button></div>
      <Status loading={loading} error={error} />
      {data && (
        <>
          <p className="note">{data.user.email} · joined {fmt(data.user.created_at)}</p>
          <div className="row"><Pill code={data.summary.plan.code}>{data.summary.plan.name}</Pill>
            <span className={`pill ${data.user.status === 'active' ? 'ok' : 'bad'}`}>{data.user.status}</span></div>
          <div className="gap"><Meter u={data.summary.usage} /></div>

          <div className="sec">Change plan</div>
          <div className="row">
            <select value={plan || data.summary.plan.code} onChange={(e) => setPlan(e.target.value)}>
              {PLANS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
            <button className="btn n" onClick={() => act(`/admin/users/${id}/plan`, { plan_code: plan || data.summary.plan.code })}>Apply</button>
            <button className="btn d" onClick={() => act(`/admin/users/${id}/status`, { status: data.user.status === 'active' ? 'suspended' : 'active' })}>
              {data.user.status === 'active' ? 'Suspend' : 'Reactivate'}</button>
          </div>
          {msg && <p className="note">{msg}</p>}

          <div className="sec">Plan history</div>
          <div className="tl">{data.entitlements.map((e) => <div key={e.id}><b>{e.plan.name}</b><small>{fmt(e.created_at)} · {e.status}{e.granted_by ? ` · by ${e.granted_by.name}` : ''}</small></div>)}
            {!data.entitlements.length && <div>Free plan (no purchase)</div>}</div>

          <div className="sec">Orders</div>
          <div className="tl">{data.orders.map((o) => <div key={o.id}>{o.order_number} · {o.plan.name}<small>{o.status}</small></div>)}
            {!data.orders.length && <div>No orders</div>}</div>

          <div className="sec">Downloads ({data.downloads.length})</div>
          <div className="tl">{data.downloads.slice(0, 12).map((d) => <div key={d.id}>{d.title.title}<small>{fmt(d.created_at)} · {d.status}</small></div>)}
            {!data.downloads.length && <div>None yet</div>}</div>

          <div className="sec">Audit trail</div>
          <div className="tl">{data.audit.slice(0, 10).map((a) => <div key={a.id}>{a.action}<small>{fmt(a.created_at)}</small></div>)}
            {!data.audit.length && <div>No actions yet</div>}</div>
        </>
      )}
    </div>
  );
}
