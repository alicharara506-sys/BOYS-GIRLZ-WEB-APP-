import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem("bg-intro-seen"));
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("bg-intro-seen", "true");
      setVisible(false);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [visible]);
  if (!visible) return null;
  return (
    <div className="loading-screen" role="status" aria-label="Loading Boys and Girlz">
      <div className="loading-panel loading-panel-left" />
      <div className="loading-panel loading-panel-right" />
      <div className="loading-stage">
        <svg className="loading-logo-mark" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M12 28v7c0 13 8 21 20 21s20-8 20-21v-7H41v7c0 7-3 11-9 11s-9-4-9-11v-7Z" />
          <circle className="loading-logo-eye" cx="19" cy="17" r="6" />
          <path className="loading-logo-spark" d="m45 8 2.7 5.3L53 16l-5.3 2.7L45 24l-2.7-5.3L37 16l5.3-2.7Z" />
        </svg>
        <div className="loading-wordmark"><b>BOYS</b><span>&amp;</span><em>GIRLS</em></div>
        <div className="loading-progress"><span /></div>
      </div>
    </div>
  );
}
