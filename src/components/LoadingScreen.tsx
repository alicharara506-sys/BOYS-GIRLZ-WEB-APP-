import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [visible]);
  if (!visible) return null;
  return (
    <div className="loading-screen" role="status" aria-label="Loading Boys and Girlz">
      <div className="loading-panel loading-panel-left" />
      <div className="loading-panel loading-panel-right" />
      <div className="loading-stage">
        <span className="loading-orbit loading-orbit-blue" aria-hidden="true" />
        <span className="loading-orbit loading-orbit-pink" aria-hidden="true" />
        <span className="loading-logo-scene"><img className="loading-brand-image" src="/assets/boys-girlz-logo.jpg" alt="Boys & Girlz" /></span>
        <span className="loading-caption">Little styles. Big smiles.</span>
        <div className="loading-progress"><span /></div>
      </div>
    </div>
  );
}
