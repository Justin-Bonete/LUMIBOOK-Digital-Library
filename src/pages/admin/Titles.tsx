import { FormEvent, useState } from 'react';
import { api, upload, useFetch } from '../../api';
import { Head, Status, size } from '../../ui';
import type { AdminTitle, Paged } from '../../types';

function Pick({ label, accept, onFile }: { label: string; accept: string; onFile(f: File): void }) {
  return (
    <label className="btn">{label}
      <input type="file" hidden accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </label>
  );
}

export default function Titles() {
  const { data, error, loading, reload } = useFetch<Paged<AdminTitle>>('/admin/titles');
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try { await fn(); setMsg({ text: ok, bad: false }); reload(); } catch (e) { setMsg({ text: (e as Error).message, bad: true }); }
  };
  const patch = (id: number, body: Partial<AdminTitle>) => run(() => api(`/admin/titles/${id}`, { method: 'PUT', body }), 'Saved.');
  const send = (id: number, part: 'cover' | 'file', f: File) => {
    const fd = new FormData(); fd.append(part, f);
    return run(() => upload(`/admin/titles/${id}/${part}`, fd), part === 'cover' ? 'Cover replaced.' : 'PDF replaced.');
  };

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!(fd.get('cover') as File)?.size) fd.delete('cover');
    setBusy(true);
    await run(() => upload('/admin/titles', fd), 'Title created as a draft. Clear its rights, then publish.');
    setBusy(false); setOpen(false);
  }
  return (
    <>
      <div className="row between"><Head title="Titles" sub="Upload PDFs, set rights, and publish." /><button className="btn n" onClick={() => setOpen(!open)}>{open ? 'Cancel' : 'Add title'}</button></div>
      {open && (
        <form className="card form" onSubmit={create}>
          <label>Title<input name="title" required maxLength={200} /></label>
          <label>Author<input name="author" required maxLength={150} /></label>
          <label>Category<input name="category" required maxLength={80} /></label>
          <label>Description<textarea name="description" rows={3} /></label>
          <label>PDF (max 100 MB)<input type="file" name="file" accept="application/pdf" required /></label>
          <label>Cover image (optional, max 2 MB)<input type="file" name="cover" accept="image/jpeg,image/png,image/webp" /></label>
          <button className="btn g" disabled={busy}>{busy ? 'Uploading…' : 'Upload title'}</button>
        </form>
      )}
      {msg && <p className={msg.bad ? 'err' : 'ok-text'}>{msg.text}</p>}
      <Status loading={loading} error={error} />
      {data && (
        <div className="tw"><table>
          <thead><tr><th>Title</th><th>Category</th><th>In plans</th><th>Rights</th><th>Visibility</th><th /></tr></thead>
          <tbody>{data.data.map((t) => (
            <tr key={t.id}>
              <td className="tcell">{t.cover_url ? <img className="thumb" src={t.cover_url} alt="" /> : <span className="thumb" />}
                <span><b>{t.title}</b><small>{t.author}{t.file_size ? ` · ${size(t.file_size)}` : ''}</small></span></td>
              <td>{t.category}</td><td>{t.plans_count}</td>
              <td><span className={`pill ${t.rights_status === 'cleared' ? 'ok' : t.rights_status === 'pending' ? 'warn' : 'bad'}`}>{t.rights_status}</span></td>
              <td>{t.visibility}</td>
              <td><div className="row">
                <button className="btn" onClick={() => patch(t.id, { rights_status: t.rights_status === 'cleared' ? 'blocked' : 'cleared' })}>{t.rights_status === 'cleared' ? 'Block' : 'Mark cleared'}</button>
                <button className="btn" onClick={() => patch(t.id, { visibility: t.visibility === 'published' ? 'draft' : 'published' })}>{t.visibility === 'published' ? 'Unpublish' : 'Publish'}</button>
                <Pick label="Cover" accept="image/jpeg,image/png,image/webp" onFile={(f) => send(t.id, 'cover', f)} />
                <Pick label="PDF" accept="application/pdf" onFile={(f) => send(t.id, 'file', f)} />
              </div></td>
            </tr>))}
            {!data.data.length && <tr><td colSpan={6}>No titles yet. Use “Add title”.</td></tr>}</tbody>
        </table></div>
      )}
    </>
  );
}
