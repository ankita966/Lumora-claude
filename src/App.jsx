import React, { useEffect } from 'react';
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
import TeacherDashboard from './dashboards/TeacherDashboard';
import SchoolAdminDashboard from './dashboards/SchoolAdminDashboard';
import AuthScreen from './auth/AuthScreen';
import PortalChoiceScreen from './auth/PortalChoiceScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './auth/AuthProvider';
import { RoleGate } from './auth/RoleGate';
import { authorizedPortal, SCREEN_ROLES } from './auth/roleRouting';
import { loadStudentProgress, seedLocalProgress } from './services/progress';

const WORLD_COMPONENTS = {
  soundForest: SoundForest,
  visionValley: VisionValley,
  storyCastle: StoryCastle,
  runeRealm: RuneRealm,
  memoryMountains: MemoryMountains,
};

function StudentProgressHydrator() {
  const { user, roles, configured, isDemo } = useAuth();
  const hydrateProgress = useGameStore((s) => s.hydrateProgress);
  useEffect(() => {
    if (!configured || isDemo || !user || !roles.includes('student')) return undefined;
    let active = true;
    loadStudentProgress(user.id)
      .then((progress) => {
        if (!active) return;
        if (progress) hydrateProgress(progress);
        else void seedLocalProgress(user.id, useGameStore.getState()).catch(() => {});
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [configured, hydrateProgress, isDemo, user, roles]);
  return null;
}

function AuthNavigation() {
  const { configured, loading, roleLoading, user, roles, identityStatus } = useAuth();
  const { screen, homeRequested, setScreen } = useGameStore();

  useEffect(() => {
    if (!configured || loading || screen === 'auth' || screen === 'portalChoice') return;
    if (!user) {
      if (screen !== 'landing') setScreen('landing');
      return;
    }
    if (roleLoading || identityStatus !== 'ready') return;
    // Home is public. Preserve an intentional visit without ending the user's session
    if (screen === 'landing' && homeRequested) return;
    const destination = authorizedPortal(roles);
    if (!destination) return;
    if (import.meta.env.DEV) {
      console.info('[ROLE] resolved role:', { userId: user.id, role: destination.role });
      console.info('[ROUTER] destination:', {
        userId: user.id,
        destination: destination.destination,
        currentScreen: screen,
      });
    }
    const permittedRoles = SCREEN_ROLES[screen];
    if (permittedRoles?.includes(destination.role)) return;
    if (permittedRoles) return;
    if (screen === destination.destination) return;
    if (import.meta.env.DEV)
      console.info('[ROLE ROUTER]', {
        userId: user.id,
        resolvedRole: destination.role,
        destination: destination.destination,
      });
    setScreen(destination.destination);
  }, [configured, homeRequested, identityStatus, loading, roleLoading, user, roles, screen, setScreen]);

  return null;
}

export default function App() {
  const { screen, calmMode, sensoryProfile } = useGameStore();
  const { configured, loading, user, roleLoading } = useAuth();
  let content;
  if (configured && (loading || (user && roleLoading))) {
    content = (
      <main className="auth-screen">
        <section className="auth-card">
          <h1>Setting up your Lumora account…</h1>
          <p>Checking your secure Lumora access.</p>
        </section>
      </main>
    );
  } else if (screen === 'portalChoice') {
    content = <PortalChoiceScreen />;
  } else if (screen === 'auth') {
    content = <AuthScreen />;
  } else if (screen === 'landing') {
    content = <Landing />;
  } else if (screen === 'map') {
    content = <WorldMap />;
  } else if (screen === 'parent') {
    content = <ParentDashboard />;
  } else if (screen === 'teacher') {
    content = <TeacherDashboard />;
  } else if (screen === 'schoolAdmin') {
    content = <SchoolAdminDashboard />;
  } else if (screen === 'specialist') {
    content = <SpecialistDashboard />;
  } else if (WORLD_COMPONENTS[screen]) {
    const WorldComponent = WORLD_COMPONENTS[screen];
    content = <WorldComponent />;
  } else {
    content = <Landing />;
  }

  return (
    <div
      className={`lumora-app screen-${screen} sensory-${
        sensoryProfile || (calmMode ? 'gentle' : 'vibrant')
      } ${calmMode ? 'calm' : ''}`}
    >
      <div className="starfield" />
      <div className="world-atmosphere" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <SettingsPanel />
      <AuthNavigation />
      <StudentProgressHydrator />
      <RoleGate screen={screen}>
        <ErrorBoundary>{content}</ErrorBoundary>
      </RoleGate>
    </div>
  );
}
