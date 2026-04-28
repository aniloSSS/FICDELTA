import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Geography from './pages/Geography';
import IfrWaypoints from './pages/IfrWaypoints';
import Phraseology from './pages/Phraseology';
import Frequencies from './pages/Frequencies';
import IcaoNames from './pages/IcaoNames';
import ReferenceMaps from './pages/ReferenceMaps';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-white text-slate-900 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-6.5rem)] w-full max-w-6xl items-start justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/geography" replace />} />
          <Route path="/geography" element={<Geography />} />
          <Route path="/ifr-waypoints" element={<IfrWaypoints />} />
          <Route path="/phraseology" element={<Phraseology />} />
          <Route path="/frequencies" element={<Frequencies />} />
          <Route path="/icao-names" element={<IcaoNames />} />
          <Route path="/reference-maps" element={<ReferenceMaps />} />
        </Routes>
      </main>
    </div>
  );
}
