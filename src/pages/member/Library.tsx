import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, useFetch } from '../../api';
import { useAuth } from '../../auth';
import { Cover, Head, Pager, Status } from '../../ui';
import type { Category, LibraryTitle, Paged } from '../../types';

export default function Library() {
  const { refresh } = useAuth();
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [category, setCategory] = useState('');
  const [access, setAccess] = useState('');
  const [sort, setSort] = useState('title');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);

  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const cats = useFetch<Category[]>('/categories');
  const qs = new URLSearchParams({ q: dq, category, access, sort, page: String(page) }).toString();
  const { data, error, loading } = useFetch<Paged<LibraryTitle>>(`/library?${qs}`);
  const pick = (fn: () => void) => { fn(); setPage(1); };

  async function download(id: number) {
    setMsg(null);
    try {
      const { url } = await api<{ url: string }>(`/titles/${id}/download`, { method: 'POST' });
      window.open(url, '_blank'); // signed, single-use link (5 minutes)
      setMsg({ text: 'Download started.', bad: false });
      refresh(); // update the remaining quota
    } catch (e) { setMsg({ text: (e as Error).message, bad: true }); }
  }
  return (
    <>
      <Head title="Library" sub="Search the catalogue. Unlocked titles can be downloaded as PDF." />
      <div className="tools">
        <input placeholder="Search title or author…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={access} onChange={(e) => pick(() => setAccess(e.target.value))}>
          <option value="">All titles</option><option value="unlocked">Unlocked</option><option value="locked">Locked</option>
        </select>
        <select value={sort} onChange={(e) => pick(() => setSort(e.target.value))}>
          <option value="title">A–Z</option><option value="newest">Newest</option>
        </select>
      </div>
      <div className="chips">
        <button className={`chip${category === '' ? ' on' : ''}`} onClick={() => pick(() => setCategory(''))}>All</button>
        {cats.data?.map((c) => (
          <button key={c.category} className={`chip${category === c.category ? ' on' : ''}`} onClick={() => pick(() => setCategory(c.category))}>{c.category} · {c.total}</button>
        ))}
      </div>
      {msg && <p className={msg.bad ? 'err' : 'ok-text'}>{msg.text}</p>}
      <Status loading={loading} error={error} />
      <div className="grid">
        {data?.data.map((t) => (
          <div key={t.id} className={`bk${t.unlocked ? '' : ' lk'}`}>
            <Link to={`/app/library/${t.id}`}><Cover t={t} locked={!t.unlocked} /></Link>
            <h3><Link to={`/app/library/${t.id}`}>{t.title}</Link></h3><p>{t.author} · {t.category}</p>
            {t.unlocked ? <button className="btn g" onClick={() => download(t.id)}>Download PDF</button>
              : <Link className="btn dis" to={`/app/library/${t.id}`}>See what unlocks it</Link>}
          </div>
        ))}
      </div>
      {data && !data.data.length && <p className="muted">No titles match. Try another search or category.</p>}
      {data && <Pager page={data.current_page} last={data.last_page} onPage={setPage} />}
    </>
  );
}
