import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import HistoryPage from './pages/History';

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/history', element: <HistoryPage /> },
  { path: '*', element: <div className="p-6">404</div> },
]);
