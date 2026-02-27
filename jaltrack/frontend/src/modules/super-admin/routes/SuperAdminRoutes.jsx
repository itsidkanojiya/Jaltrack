import { Routes, Route } from 'react-router-dom';
import SuperAdminLayout from '../layout/SuperAdminLayout';
import Dashboard from '../pages/Dashboard';
import Businesses from '../pages/Businesses';
import BusinessDetail from '../pages/BusinessDetail';
import Plans from '../pages/Plans';
import Users from '../pages/Users';
import Leads from '../pages/Leads';
import Analytics from '../pages/Analytics';
import Announcements from '../pages/Announcements';
import AuditLogs from '../pages/AuditLogs';

export default function SuperAdminRoutes() {
  return (
    <Routes>
      <Route element={<SuperAdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="businesses" element={<Businesses />} />
        <Route path="businesses/:id" element={<BusinessDetail />} />
        <Route path="plans" element={<Plans />} />
        <Route path="users" element={<Users />} />
        <Route path="leads" element={<Leads />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="logs" element={<AuditLogs />} />
      </Route>
    </Routes>
  );
}
