import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';

const NAV = {
  admin: [['/admin', 'Overview'], ['/admin/users', 'Users & plans'], ['/admin/titles', 'Titles'], ['/admin/collections', 'Plan collections'], ['/admin/activity', 'Activity']],
  member: [['/app', 'My plan'], ['/app/library', 'Library'], ['/app/history', 'Download history']],
} as const;

export default function Layout({ children }: { children: ReactNode }) {
  const { me, logout } = useAuth();
  const nav = useNavigate();
  if (!me) return null;
  const role = me.user.role;
  return (
    <div className="app">
      <aside>
        <div className="logo">LUMIBOOK</div>
        <small>{role === 'admin' ? 'OWNER CONSOLE' : 'MEMBER AREA'}</small>
        {NAV[role].map(([to, label]) => (
          <NavLink key={to} to={to} end className={({ isActive }) => 'nav' + (isActive ? ' on' : '')}>{label}</NavLink>
        ))}
        <div className="who">
          <b>{me.user.name}</b>{role === 'admin' ? 'Owner / Admin' : me.plan.name}
          <button className="btn" onClick={async () => { await logout(); nav('/login'); }}>Sign out</button>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
