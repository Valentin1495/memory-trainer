import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Game } from './pages/Game';
import { Result } from './pages/Result';
import { Leaderboard } from './pages/Leaderboard';
import { initAdMob } from './lib/admob';
import { initIAP } from './lib/iap';

function App() {
  useEffect(() => {
    initAdMob();
    initIAP();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game" element={<Game />} />
      <Route path="/result" element={<Result />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}

export default App;
