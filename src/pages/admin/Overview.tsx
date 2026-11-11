import { useFetch } from '../../api';
import { Head, Status } from '../../ui';
import type { Stats } from '../../types';

const NAMES: Record<string, string> = { free: 'Free', premium: 'Premium', plus: 'Premium Plus', all: 'All Access' };

export default function Overview() {
  const { data, error, loading } = useFetch<Stats>('/admin/stats');
  return (
    <>
      <Head title="Overview" sub="Everyone on the platform, at a glance." />
      <Status loading={loading} error={error} />
      {data && (
        <>
          <div className="cards">
            <div className="card stat"><b>{data.members}</b><span>Members</span></div>
            <div className="card stat"><b>{data.members - (data.by_plan.free ?? 0)}</b><span>On a paid plan</span></div>
            <div className="card stat"><b>{data.at_limit}</b><span>At their download limit</span></div>
            <div className="card stat"><b>{data.suspended}</b><span>Suspended</span></div>
            <div className="card stat"><b>{data.downloads_30d}</b><span>Downloads, last 30 days</span></div>
          </div>
          <div className="card">
            <h3>Members by plan</h3>
            <div className="bars">
              {Object.keys(NAMES).map((k) => (
                <div key={k}><span>{NAMES[k]}</span>
                  <span className="bar"><i style={{ width: `${data.members ? ((data.by_plan[k] ?? 0) / data.members) * 100 : 0}%` }} /></span>
                  <b>{data.by_plan[k] ?? 0}</b></div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
