import { Routes, Route } from 'react-router-dom';
import ClientLayout from '../layout/ClientLayout';
import ClientDashboard from '../pages/ClientDashboard';
import ClientBilling from '../pages/ClientBilling';
import ClientDeliveries from '../pages/ClientDeliveries';
import ClientIssues from '../pages/ClientIssues';

export default function ClientRoutes() {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route index element={<ClientDashboard />} />
        <Route path="billing" element={<ClientBilling />} />
        <Route path="deliveries" element={<ClientDeliveries />} />
        <Route path="issues" element={<ClientIssues />} />
      </Route>
    </Routes>
  );
}
