import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './screens/Home';
import Mission from './screens/Mission';

function Reveal() {
  return <div className="p-4 text-white min-h-screen bg-gray-900">Reveal Screen</div>;
}

function Result() {
  return <div className="p-4 text-white min-h-screen bg-gray-900">Result Screen</div>;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/m/:payload" element={<Mission />} />
        <Route path="/reveal/:payload" element={<Reveal />} />
        <Route path="/result/:payload" element={<Result />} />
      </Routes>
    </HashRouter>
  );
}
