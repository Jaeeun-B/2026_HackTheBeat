import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './screens/Home';
import Mission from './screens/Mission';
import Reveal from './screens/Reveal';

import Result from './screens/Result';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/m/:payload" element={<Mission />} />
        <Route path="/reveal/:payload" element={<Reveal />} />
        <Route path="/result/:payload" element={<Result />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  );
}
