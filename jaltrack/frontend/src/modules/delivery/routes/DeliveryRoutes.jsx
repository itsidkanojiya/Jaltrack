import { Routes, Route } from 'react-router-dom';
import DeliveryLayout from '../layout/DeliveryLayout';
import Today from '../pages/Today';
import DeliverConfirm from '../pages/DeliverConfirm';
import SpotSupplyMobile from '../pages/SpotSupplyMobile';
import History from '../pages/History';

export default function DeliveryRoutes() {
  return (
    <Routes>
      <Route element={<DeliveryLayout />}>
        <Route index element={<Today />} />
        <Route path="deliver/:id" element={<DeliverConfirm />} />
        <Route path="spot" element={<SpotSupplyMobile />} />
        <Route path="history" element={<History />} />
      </Route>
    </Routes>
  );
}
