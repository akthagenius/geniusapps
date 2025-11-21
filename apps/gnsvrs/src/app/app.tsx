import { Routes, Route } from 'react-router-dom';
import AudioVisualizer from './components/AudioVisualizer';
import BeatStore from './components/BeatStore';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AudioVisualizer />} />
      <Route path="/beatstore" element={<BeatStore />} />
    </Routes>
  );
}

export default App;



