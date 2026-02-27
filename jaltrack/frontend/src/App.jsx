import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './core/auth/Login';
import RouteGuard from './core/auth/RouteGuard';
import LandingPage from './landing/LandingPage';
import AdminRoutes from './modules/admin/routes/AdminRoutes';
import DeliveryRoutes from './modules/delivery/routes/DeliveryRoutes';
import ClientRoutes from './modules/client/routes/ClientRoutes';
import SuperAdminRoutes from './modules/super-admin/routes/SuperAdminRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Per-role login pages */}
        <Route path="/business/login" element={<Login expectedRole="admin" />} />
        <Route path="/super-admin/login" element={<Login expectedRole="super_admin" />} />
        <Route path="/delivery/login" element={<Login expectedRole="delivery_boy" />} />
        <Route path="/client/login" element={<Login expectedRole="client" />} />

        {/* Protected role modules */}
        <Route path="/business/*" element={
          <RouteGuard allowedRoles={['admin', 'super_admin']}>
            <AdminRoutes />
          </RouteGuard>
        } />

        <Route path="/delivery/*" element={
          <RouteGuard allowedRoles={['delivery_boy']}>
            <DeliveryRoutes />
          </RouteGuard>
        } />

        <Route path="/client/*" element={
          <RouteGuard allowedRoles={['client']}>
            <ClientRoutes />
          </RouteGuard>
        } />

        <Route path="/super-admin/*" element={
          <RouteGuard allowedRoles={['super_admin']}>
            <SuperAdminRoutes />
          </RouteGuard>
        } />
      </Routes>
    </BrowserRouter>
  );
}
