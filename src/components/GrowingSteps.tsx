import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import gsap from "gsap";
import { Heart, Shirt, Sparkles, Star } from "lucide-react";
import { useReducedMotion } from "../hooks/useExperience";

// The staircase, bottom to top: where each step sits in the stage (percent), its colour and icon.
const steps = [
  { x: 2, y: 4, tint: "#00b3fc", Icon: Star },
  { x: 26, y: 20, tint: "#fc538e", Icon: Heart },
  { x: 50, y: 36, tint: "#00b3fc", Icon: Shirt },
  { x: 74, y: 52, tint: "#fc538e", Icon: Sparkles },
];
const STEP_W = 23;
const STEP_H = 11;
const KID_W = 19;
const spot = (i: number) => ({ left: steps[i].x + STEP_W / 2 - KID_W / 2, bottom: steps[i].y + STEP_H });
const hearts = Array.from({ length: 10 }, (_, i) => i * 36);

// Growing up as a staircase: glass steps rising from bottom left to top right, and the boy and
// girl hopping up them one after the other. Each step lights up as a character lands on it; at
// the top a burst of hearts, then they pop back to the first step and climb again. The whole
// scene tilts gently toward the cursor like a little diorama.
export default function GrowingSteps() {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const stepEls = stage.querySelectorAll<HTMLElement>(".gs-step");
    const place = (kid: string, i: number) => gsap.set(stage.querySelector(`.gs-kid-${kid}`), { left: `${spot(i).left}%`, bottom: `${spot(i).bottom}%` });
    if (reduceMotion) { place("boy", 1); place("girl", 0); return; }

    const ctx = gsap.context(() => {
      gsap.from(".gs-step", { y: 60, opacity: 0, duration: 0.9, ease: "back.out(1.6)", stagger: 0.12, delay: 0.3 });
      gsap.from(".gs-path path", { strokeDashoffset: 100, duration: 1.4, ease: "power2.inOut", delay: 0.6 });
      const climb = (kid: "boy" | "girl") => {
        const el = stage.querySelector(`.gs-kid-${kid}`);
        const body = stage.querySelector(`.gs-kid-${kid} .gs-body`);
        const sprite = stage.querySelector(`.gs-kid-${kid} .gs-sprite`);
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
        tl.set(el, { left: `${spot(0).left}%`, bottom: `${spot(0).bottom}%` })
          .fromTo(sprite, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2.2)" });
        for (let i = 1; i < steps.length; i++) {
          tl.to(sprite, { scaleX: 1.12, scaleY: 0.86, duration: 0.14, ease: "power2.out", transformOrigin: "50% 100%" }, "+=0.55")
            .to(el, { left: `${spot(i).left}%`, bottom: `${spot(i).bottom}%`, duration: 0.6, ease: "none" })
            .to(body, { yPercent: -55, duration: 0.3, ease: "power2.out" }, "<")
            .to(body, { yPercent: 0, duration: 0.3, ease: "power2.in" }, ">")
            .to(sprite, { scaleX: 0.94, scaleY: 1.08, duration: 0.3, ease: "sine.out" }, "<-0.3")
            .to(sprite, { scaleX: 1.1, scaleY: 0.9, duration: 0.1, ease: "power2.out" })
            .to(sprite, { scaleX: 1, scaleY: 1, duration: 0.35, ease: "elastic.out(1, .4)" })
            .call(() => { stepEls[i].classList.remove("is-lit"); void stepEls[i].offsetWidth; stepEls[i].classList.add("is-lit"); }, [], "<-0.1");
        }
        tl.call(() => { const burst = stage.querySelector(`.gs-burst-${kid}`); burst?.classList.remove("is-on"); void (burst as HTMLElement | null)?.offsetWidth; burst?.classList.add("is-on"); })
          .to(sprite, { rotate: kid === "boy" ? -12 : 12, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut" }, "+=0.1")
          .to(sprite, { scale: 0, opacity: 0, duration: 0.4, ease: "back.in(2)" }, "+=0.3");
        return tl;
      };
      climb("boy").delay(1.4);
      climb("girl").delay(5.4);
    }, stage);
    return () => ctx.revert();
  }, [reduceMotion]);

  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--ry", `${((event.clientX - box.left) / box.width - 0.5) * 14}deg`);
    event.currentTarget.style.setProperty("--rx", `${(0.5 - (event.clientY - box.top) / box.height) * 10}deg`);
  };
  const settle = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--ry", "0deg");
    event.currentTarget.style.setProperty("--rx", "0deg");
  };

  return <div className="gs" onPointerMove={tilt} onPointerLeave={settle} aria-hidden="true">
    <div className="gs-stage" ref={stageRef}>
      <span className="gs-glow gs-glow-blue" />
      <span className="gs-glow gs-glow-pink" />
      <svg className="gs-path" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs><linearGradient id="gs-ink" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#00b3fc" /><stop offset="1" stopColor="#fc538e" /></linearGradient></defs>
        <path pathLength={100} d={`M${spot(0).left + KID_W / 2},${100 - spot(0).bottom} ${steps.slice(1).map((_, i) => `Q${(steps[i].x + steps[i + 1].x) / 2 + STEP_W / 2},${100 - steps[i + 1].y - STEP_H - 18} ${spot(i + 1).left + KID_W / 2},${100 - spot(i + 1).bottom}`).join(" ")}`} />
      </svg>
      {steps.map(({ x, y, tint, Icon }, i) => <div className="gs-step" key={i} style={{ left: `${x}%`, bottom: `${y}%`, width: `${STEP_W}%`, height: `${STEP_H}%`, "--tint": tint } as CSSProperties}>
        <span className="gs-step-top" />
        <span className="gs-step-icon"><Icon size={19} /></span>
      </div>)}
      {(["boy", "girl"] as const).map((kid) => <div className={`gs-kid gs-kid-${kid}`} key={kid} style={{ width: `${KID_W}%`, left: `${spot(0).left}%`, bottom: `${spot(0).bottom}%` }}>
        <div className="gs-body">
          <span className={`home-mascot home-mascot-${kid} gs-sprite`} />
        </div>
        <span className={`gs-burst gs-burst-${kid}`}>{hearts.map((a) => <i key={a} style={{ "--a": `${a}deg` } as CSSProperties}>♥</i>)}</span>
      </div>)}
    </div>
  </div>;
}
