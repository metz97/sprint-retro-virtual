import { useEffect } from 'react';
import { World } from './scene/World';
import { useRetro } from './store';
import { JoinScreen } from './ui/JoinScreen';
import { Panel } from './ui/Panel';
import { ReactionBar } from './ui/ReactionBar';
import { TopBar } from './ui/TopBar';

export function App() {
  const joined = useRetro((s) => !!s.session);
  return (
    <>
      <div className="canvas-wrap">
        <World />
      </div>
      {joined ? (
        <>
          <Panel />
          <TopBar />
          <ReactionBar />
        </>
      ) : (
        <JoinScreen />
      )}
      <Toast />
    </>
  );
}

function Toast() {
  const toast = useRetro((s) => s.toast);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => useRetro.setState({ toast: null }), 2800);
    return () => clearTimeout(id);
  }, [toast]);
  return toast ? (
    <div key={toast.key} className="toast">
      {toast.text}
    </div>
  ) : null;
}
