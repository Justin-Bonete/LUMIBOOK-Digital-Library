import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './Layout';
import Login from './pages/Login';
import Overview from './pages/admin/Overview';
import Users from './pages/admin/Users';
import Titles from './pages/admin/Titles';
import Activity from './pages/admin/Activity';
import Collections from './pages/admin/Collections';
import TitleDetail from './pages/member/TitleDetail';
import MyPlan from './pages/member/MyPlan';
import Library from './pages/member/Library';
import History from './pages/member/History';
import type { Role } from './types';

/** Server enforces roles too; this just keeps the UI honest. */
function Guard({ role }: { role: Role }) {
  const { me, loading } = useAuth();
  if (loading) return <p className="center">Loading…</p>;
  if (!me) return <Navigate to="/login" replace />;
  if (me.user.role !== role) return <Navigate to="/" replace />;
  return <Layout><Outlet /></Layout>;
}

function Home() {
  const { me, loading } = useAuth();
  if (loading) return <p className="center">Loading…</p>;
  if (!me) return <Navigate to="/login" replace />;
  return <Navigate to={me.user.role === 'admin' ? '/admin' : '/app'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Guard role="admin" />}>
        <Route index element={<Overview />} />
        <Route path="users" element={<Users />} />
        <Route path="titles" element={<Titles />} />
        <Route path="collections" element={<Collections />} />
        <Route path="activity" element={<Activity />} />
      </Route>
      <Route path="/app" element={<Guard role="member" />}>
        <Route index element={<MyPlan />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id" element={<TitleDetail />} />
        <Route path="history" element={<History />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
