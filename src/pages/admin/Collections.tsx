import { useEffect, useState } from 'react';
import { api, useFetch } from '../../api';
import { Head, Status } from '../../ui';
import type { AdminTitle, Paged, PlanDetail, PlanInfo } from '../../types';

export default function Collections() {
  const plans = useFetch<PlanInfo[]>('/admin/plans');
  const titles = useFetch<Paged<AdminTitle>>('/admin/titles?per_page=200');
  const [planId, setPlanId] = useState<number | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);

  const plan = plans.data?.find((p) => p.id === planId) ?? null;
  useEffect(() => { if (!planId && plans.data?.length) setPlanId(plans.data[0].id); }, [plans.data, planId]);
  useEffect(() => {
    if (!planId) return;
    api<PlanDetail>(`/admin/plans/${planId}`).then((d) => setPicked(new Set(d.title_ids))).catch((e: Error) => setMsg({ text: e.message, bad: true }));
  }, [planId]);

  const limit = plan?.ebook_limit ?? null;
  const toggle = (id: number) => setPicked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function save() {
    setMsg(null);
    try { await api(`/admin/plans/${planId}/titles`, { method: 'PUT', body: { title_ids: [...picked] } }); setMsg({ text: 'Collection saved.', bad: false }); plans.reload(); }
    catch (e) { setMsg({ text: (e as Error).message, bad: true }); }
  }
  return (
    <>
      <Head title="Plan collections" sub="Choose which titles each plan includes. Higher plans should include the lower plans’ titles." />
      <Status loading={plans.loading || titles.loading} error={plans.error || titles.error} />
      <div className="chips">
        {plans.data?.map((p) => <button key={p.id} className={`chip${p.id === planId ? ' on' : ''}`} onClick={() => setPlanId(p.id)}>{p.name}</button>)}
      </div>
      {plan && limit === null && <p className="card">All Access includes every published, rights-cleared title. No curation needed.</p>}
      {plan && limit !== null && (
        <>
          <p className="muted">{picked.size} of {limit} titles selected</p>
          <div className="card checks">
            {titles.data?.data.map((t) => (
              <label key={t.id}><input type="checkbox" checked={picked.has(t.id)} disabled={!picked.has(t.id) && picked.size >= limit} onChange={() => toggle(t.id)} />
                <span>{t.title}<small>{t.category} · {t.rights_status}/{t.visibility}</small></span></label>
            ))}
            {titles.data && !titles.data.data.length && <p className="muted">Upload titles first.</p>}
          </div>
          {msg && <p className={msg.bad ? 'err' : 'ok-text'}>{msg.text}</p>}
          <button className="btn n" onClick={save}>Save collection</button>
        </>
      )}
    </>
  );
}
