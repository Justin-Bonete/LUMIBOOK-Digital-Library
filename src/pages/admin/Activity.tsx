import { useFetch } from '../../api';
import { Head, Status } from '../../ui';
import type { AuditRow, Paged } from '../../types';

export default function Activity() {
  const { data, error, loading } = useFetch<Paged<AuditRow>>('/admin/audit');
  return (
    <>
      <Head title="Activity" sub="Audit trail of admin actions and downloads." />
      <Status loading={loading} error={error} />
      {data && <div className="card">{data.data.map((a) => (
        <div key={a.id} className="line"><b>{a.actor?.name ?? 'System'}</b> · <span className="pill free">{a.action}</span> {a.entity_type} #{a.entity_id}
          <small>{new Date(a.created_at).toLocaleString()}</small></div>))}
        {!data.data.length && <p>Nothing logged yet.</p>}</div>}
    </>
  );
}
