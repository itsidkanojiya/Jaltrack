import { Navigate, useLocation } from 'react-router-dom';

function decodePayload(token) {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function getLoginPath(pathname) {
  if (pathname.startsWith('/super-admin')) return '/super-admin/login';
  if (pathname.startsWith('/business')) return '/business/login';
  if (pathname.startsWith('/delivery')) return '/delivery/login';
  if (pathname.startsWith('/client')) return '/client/login';
  return '/business/login';
}

export default function RouteGuard({ allowedRoles, children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const loginPath = getLoginPath(location.pathname);

  if (!token) {
    return <Navigate to={loginPath} replace />;
  }

  const payload = decodePayload(token);
  if (!payload || !allowedRoles.includes(payload.role)) {
    return <Navigate to={loginPath} replace />;
  }

  return children;
}
