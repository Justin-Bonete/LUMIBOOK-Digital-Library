import { useAuth } from '../../auth';
import { Head, Meter, Pill } from '../../ui';

export default function MyPlan() {
  const { me } = useAuth();
  if (!me) return null;
  const { plan, usage, titles_unlocked } = me;
  return (
    <>
      <Head title={`Hello, ${me.user.name.split(' ')[0]}`} sub="Here is what your plan includes." />
      <div className="cards">
        <div className="card"><Pill code={plan.code}>{plan.name}</Pill><h3>{titles_unlocked} titles unlocked</h3></div>
        <div className="card"><h3>Downloads</h3><div className="gap"><Meter u={usage} /></div>
          <p className="note">{usage.remaining === null ? 'Unlimited, subject to fair-use.' : `${usage.remaining} left${usage.period === 'month' ? ' this month' : ' (lifetime total)'}`}</p></div>
      </div>
    </>
  );
}
