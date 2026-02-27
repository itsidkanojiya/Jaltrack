import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import Dashboard from '../pages/Dashboard';
import Customers from '../pages/Customers';
import Deliveries from '../pages/Deliveries';
import SpotSupply from '../pages/SpotSupply';
import Events from '../pages/Events';
import Billing from '../pages/Billing';
import Payments from '../pages/Payments';
import Expenses from '../pages/Expenses';
import Salary from '../pages/Salary';
import Holidays from '../pages/Holidays';
import JugTracking from '../pages/JugTracking';
import Profit from '../pages/Profit';
import RoutesList from '../pages/RoutesList';
import RouteForm from '../pages/RouteForm';
import RouteDetail from '../pages/RouteDetail';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="routes" element={<RoutesList />} />
        <Route path="routes/new" element={<RouteForm />} />
        <Route path="routes/:id/edit" element={<RouteForm />} />
        <Route path="routes/:id" element={<RouteDetail />} />
        <Route path="spot-supply" element={<SpotSupply />} />
        <Route path="events" element={<Events />} />
        <Route path="billing" element={<Billing />} />
        <Route path="payments" element={<Payments />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="salary" element={<Salary />} />
        <Route path="holidays" element={<Holidays />} />
        <Route path="jug-tracking" element={<JugTracking />} />
        <Route path="profit" element={<Profit />} />
      </Route>
    </Routes>
  );
}
