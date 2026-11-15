import { useEffect, useRef, useState } from "react";
import { Check, Flashlight, ScanLine, TriangleAlert } from "lucide-react";
import { Modal } from "./ui";

// What the POS says about a scanned code: added to the sale, or not found.
export type ScanResult = { ok: boolean; label: string };

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorClass = {
  new (options: { formats: string[] }): Detector;
  getSupportedFormats?: () => Promise<string[]>;
};

// Scans the shop's printed labels (CODE128) with the phone or laptop camera and adds each item to
// the sale. Keeps scanning so several items can be rung up in a row; the same code is ignored for
// a moment so one label isn't counted twice. Uses the browser's built-in reader (Chrome on
// Android) and falls back to a JavaScript reader, loaded only when needed, elsewhere.
export function CameraScanner({ onCode, onClose }: { onCode: (code: string) => ScanResult; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const [problem, setProblem] = useState("");
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState<boolean | null>(null);
  const [recent, setRecent] = useState<(ScanResult & { at: number })[]>([]);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopZxing: (() => void) | null = null;
    const last = { code: "", at: 0 };
    const handle = (code: string) => {
      const now = Date.now();
      if (code === last.code && now - last.at < 2500) return;
      last.code = code;
      last.at = now;
      const result = onCodeRef.current(code.trim());
      navigator.vibrate?.(result.ok ? 60 : [40, 60, 40]);
      beep(result.ok);
      setRecent((list) => [{ ...result, at: now }, ...list].slice(0, 5));
    };
    (async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setProblem("The camera only works on a secure address: the live https site, or localhost on this computer. It can't open on the http:// Wi-Fi link.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      } catch (error) {
        setProblem((error as Error).name === "NotAllowedError"
          ? "Camera access was blocked. Allow the camera for this site in the browser's settings, then try again."
          : "No camera could be opened on this device.");
        return;
      }
      if (stopped || !video.current) return stream.getTracks().forEach((t) => t.stop());
      const element = video.current;
      element.srcObject = stream;
      await element.play().catch(() => undefined);
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;
      const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
      if (capabilities.torch) setTorch(false);
      setReady(true);
      const Native = (window as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
      const formats = await Native?.getSupportedFormats?.().catch(() => []) ?? [];
      if (Native && formats.includes("code_128")) {
        const detector = new Native({ formats: ["code_128", "ean_13", "ean_8", "upc_a", "code_39"] });
        const scan = async () => {
          if (stopped) return;
          try {
            const found = await detector.detect(element);
            if (found[0]?.rawValue) handle(found[0].rawValue);
          } catch { /* a frame that couldn't be read */ }
          timer = window.setTimeout(scan, 180);
        };
        scan();
      } else {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (stopped) return;
        const reader = new BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 180, delayBetweenScanSuccess: 300 });
        const controls = await reader.decodeFromVideoElement(element, (result) => { if (result) handle(result.getText()); });
        stopZxing = () => controls.stop();
      }
    })();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stopZxing?.();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleTorch = async () => {
    const next = !torch;
    try {
      await trackRef.current?.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorch(next);
    } catch { setTorch(null); }
  };

  return (
    <Modal title="Scan with camera" onClose={onClose} className="co-scanner">
      {problem
        ? <div className="co-alert error" role="alert"><TriangleAlert size={17} /> {problem}</div>
        : <div className="scan-stage">
            <video ref={video} playsInline muted aria-label="Camera view" />
            <span className="scan-frame" aria-hidden="true"><ScanLine size={36} /></span>
            {!ready && <p className="scan-wait">Opening the camera…</p>}
            {torch !== null && <button type="button" className="co-button scan-torch" aria-pressed={torch} onClick={toggleTorch}><Flashlight size={16} /> {torch ? "Light off" : "Light on"}</button>}
          </div>}
      <p className="co-help">Hold the label's barcode inside the frame. Each scan adds one item to the sale; scan again for another.</p>
      <ul className="scan-log" aria-live="polite">
        {recent.map((r) => <li key={r.at} className={r.ok ? "is-ok" : "is-miss"}>{r.ok ? <Check size={15} /> : <TriangleAlert size={15} />} {r.label}</li>)}
      </ul>
      <button type="button" className="co-button primary scan-done" onClick={onClose}>Done</button>
    </Modal>
  );
}

// A short tone: higher when an item was added, lower when the code wasn't found.
function beep(ok: boolean) {
  try {
    const Context = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const audio = new Context();
    const tone = audio.createOscillator();
    const gain = audio.createGain();
    tone.frequency.value = ok ? 1320 : 330;
    gain.gain.value = 0.08;
    tone.connect(gain).connect(audio.destination);
    tone.start();
    tone.stop(audio.currentTime + (ok ? 0.09 : 0.2));
    tone.onended = () => void audio.close();
  } catch { /* sound is optional */ }
}
