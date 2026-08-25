import React from 'react';
import { useGameStore } from './store/useGameStore';
import Landing from './components/Landing';
import WorldMap from './components/WorldMap';
import SettingsPanel from './components/SettingsPanel';
import SoundForest from './worlds/soundForest/SoundForest';
import VisionValley from './worlds/visionValley/VisionValley';
import StoryCastle from './worlds/storyCastle/StoryCastle';
import RuneRealm from './worlds/runeRealm/RuneRealm';
import MemoryMountains from './worlds/memoryMountains/MemoryMountains';
import ParentDashboard from './dashboards/ParentDashboard';
import SpecialistDashboard from './dashboards/SpecialistDashboard';

const WORLD_COMPONENTS = {
  soundForest: SoundForest,
  visionValley: VisionValley,
  storyCastle: StoryCastle,
  runeRealm: RuneRealm,
  memoryMountains: MemoryMountains,
};

export default function App() {
  const { screen, calmMode } = useGameStore();

  let content;
  if (screen === 'landing') content = <Landing />;
  else if (screen === 'map') content = <WorldMap />;
  else if (screen === 'parent') content = <ParentDashboard />;
  else if (screen === 'specialist') content = <SpecialistDashboard />;
  else if (WORLD_COMPONENTS[screen]) {
    const WorldComponent = WORLD_COMPONENTS[screen];
    content = <WorldComponent />;
  } else {
    content = <Landing />;
  }

  return (
    <div className={`lumora-app screen-${screen} ${calmMode ? 'calm' : ''}`}>
      <div className="starfield" />
      <div className="world-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <SettingsPanel />
      {content}
    </div>
  );
}
