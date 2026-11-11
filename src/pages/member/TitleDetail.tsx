import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, useFetch } from '../../api';
import { useAuth } from '../../auth';
import { Cover, Head, Status, size } from '../../ui';
import type { TitleDetail as Detail } from '../../types';

export default function TitleDetail() {
  const { id } = useParams();
  const { data: t, error, loading } = useFetch<Detail>(`/titles/${id}`);
  const { refresh } = useAuth();
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);

  async function download() {
    setMsg(null);
    try {
      const { url } = await api<{ url: string }>(`/titles/${id}/download`, { method: 'POST' });
      window.open(url, '_blank');
      setMsg({ text: 'Download started.', bad: false });
      refresh();
    } catch (e) { setMsg({ text: (e as Error).message, bad: true }); }
  }
  return (
    <>
      <p><Link to="/app/library" className="muted">← Back to library</Link></p>
      <Status loading={loading} error={error} />
      {t && (
        <>
          <div className="detail">
            <div className="dcover"><Cover t={t} locked={!t.unlocked} /></div>
            <div>
              <Head title={t.title} sub={`${t.author} · ${t.category}${t.file_size ? ' · PDF, ' + size(t.file_size) : ''}`} />
              <p className="desc">{t.description ?? 'No description yet.'}</p>
              {msg && <p className={msg.bad ? 'err' : 'ok-text'}>{msg.text}</p>}
              {t.unlocked
                ? <button className="btn g" onClick={download}>Download PDF</button>
                : <div className="card"><b>Locked on your plan.</b><p className="note">Included from <b>{t.required_plan?.name ?? 'a higher plan'}</b>. Upgrading will be available once checkout is live.</p></div>}
            </div>
          </div>
          {t.related.length > 0 && (
            <>
              <div className="sec">More in {t.category}</div>
              <div className="grid">{t.related.map((r) => (
                <div key={r.id} className="bk"><Link to={`/app/library/${r.id}`}><Cover t={r} /></Link><h3><Link to={`/app/library/${r.id}`}>{r.title}</Link></h3><p>{r.author}</p></div>
              ))}</div>
            </>
          )}
        </>
      )}
    </>
  );
}
