import { useFetch } from '../../api';
import { Head, Status, fmt } from '../../ui';
import type { HistoryRow, Paged } from '../../types';

export default function History() {
  const { data, error, loading } = useFetch<Paged<HistoryRow>>('/history');
  return (
    <>
      <Head title="Download history" sub="Every download counted against your plan." />
      <Status loading={loading} error={error} />
      {data && <div className="tw"><table>
        <thead><tr><th>Title</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>{data.data.map((e) => <tr key={e.id}><td>{e.title.title}</td><td>{fmt(e.created_at)}</td><td><span className="pill ok">{e.status}</span></td></tr>)}
          {!data.data.length && <tr><td colSpan={3}>Your learning journey is waiting. Discover your first book.</td></tr>}</tbody>
      </table></div>}
    </>
  );
}
