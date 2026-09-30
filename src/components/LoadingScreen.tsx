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
        <img className="loading-brand-image" src="/assets/boys-girlz-logo.jpg" alt="Boys & Girlz" />
        <div className="loading-progress"><span /></div>
      </div>
    </div>
  );
}
