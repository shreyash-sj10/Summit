import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/context/AuthContext';
import { useAuth } from './shared/context/useAuth';
import Landing from './pages/Landing';
import MemberDashboard from './member/pages/Dashboard';
import ModeratorDashboard from './moderator/pages/Dashboard';
import DisplayDashboard from './display/pages/Dashboard';
import ProjectionPage from './display/pages/ProjectionPage';

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;

  // DASHMOD can only access projection dashboard
  if (user.member_id === 'DASHMOD' && requiredRole !== 'display') {
    return <Navigate to="/projection" replace />;
  }

  if (requiredRole === 'moderator' && user.role !== 'moderator' && user.role !== 'judge') {
    return <Navigate to={user.role === 'display' ? '/display' : '/member'} replace />;
  }
  if (requiredRole === 'display' && user.role !== 'display' && user.member_id !== 'DASHMOD') {
    return <Navigate to={user.role === 'moderator' || user.role === 'judge' ? '/moderator' : '/member'} replace />;
  }
  if (requiredRole === 'member' && user.role !== 'member') {
    return <Navigate to={user.role === 'display' ? '/display' : '/moderator'} replace />;
  }
  return children;
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Landing />;

  // DASHMOD and all display roles always go to projection dashboard
  if (user.member_id === 'DASHMOD') return <Navigate to="/projection" replace />;

  if (user.role === 'display') return <Navigate to="/projection" replace />;
  if (user.role === 'moderator' || user.role === 'judge') return <Navigate to="/moderator" replace />;

  return <Navigate to="/member" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/member"
            element={
              <ProtectedRoute requiredRole="member">
                <MemberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moderator"
            element={
              <ProtectedRoute requiredRole="moderator">
                <ModeratorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/display"
            element={
              <ProtectedRoute requiredRole="display">
                <Navigate to="/projection" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projection"
            element={
              <ProtectedRoute requiredRole="display">
                <ProjectionPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
