import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem("bg-intro-seen"));
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("bg-intro-seen", "true");
      setVisible(false);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [visible]);
  if (!visible) return null;
  return (
    <div className="loading-screen" role="status" aria-label="Loading Boys and Girlz">
      <div className="loading-panel loading-panel-left" />
      <div className="loading-panel loading-panel-right" />
      <div className="loading-stage">
        <div className="loading-mascot" aria-hidden="true">
          <span className="loading-eye loading-eye-left" />
          <span className="loading-eye loading-eye-right" />
          <span className="loading-smile" />
          <span className="loading-spark">✦</span>
        </div>
        <div className="loading-wordmark"><b>BOYS</b><span>&amp;</span><em>GIRLS</em></div>
        <div className="loading-progress"><span /></div>
      </div>
    </div>
  );
}
