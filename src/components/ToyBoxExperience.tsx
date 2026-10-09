import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Heart } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useExperience";

gsap.registerPlugin(ScrollTrigger);
const areas = [
  { key: "opening", eyebrow: "Made for little moments", heading: <>Little clothes,<br /><span>for big smiles.</span></>, body: "A children's clothing shop in Lebanon, with little finds for every day.", path: "/shop", action: "Explore the shop" },
  { key: "boys", eyebrow: "The boys' corner", heading: <>Ready, set,<br /><span>play.</span></>, body: "Everyday outfits and layers for little adventures.", path: "/category/boys", action: "Shop Boys" },
  { key: "girls", eyebrow: "The girls' corner", heading: <>Made to<br /><span>shine.</span></>, body: "Sweet details and comfortable pieces for every day.", path: "/category/girls", action: "Shop Girls" },
  { key: "baby", eyebrow: "The baby nursery", heading: <>Hello, little<br /><span>one.</span></>, body: "Soft essentials for newborns and babies.", path: "/category/unisex", action: "Shop Unisex" },
  { key: "toys", eyebrow: "The toy shelf", heading: <>Small toys,<br /><span>big smiles.</span></>, body: "Playtime companions and thoughtful gifts.", path: "/category/toys", action: "Shop Toys" },
];
const floatingLetters = [
  { letter: "O", name: "o" },
  { letter: "Y", name: "y" },
  { letter: "S", name: "s" },
  { letter: "&", name: "amp" },
  { letter: "I", name: "i" },
  { letter: "R", name: "r" },
  { letter: "L", name: "l" },
  { letter: "Z", name: "z" },
] as const;
export default function ToyBoxExperience() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [animateEntrance, setAnimateEntrance] = useState(false);
  useEffect(() => {
    if (reduceMotion) return;
    if (sessionStorage.getItem("bg-logo-entered") !== "1") {
      setAnimateEntrance(true);
      sessionStorage.setItem("bg-logo-entered", "1");
    }
  }, [reduceMotion]);
  useEffect(() => {
    const element = sectionRef.current;
    if (!element || reduceMotion) return;
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setActive(Math.min(areas.length - 1, Math.floor(self.progress * areas.length))),
    });
    return () => trigger.kill();
  }, [reduceMotion]);
  return <section ref={sectionRef} className="toybox-journey" aria-label="Explore Boys & Girlz">
    <div className="toybox-sticky" aria-hidden="true">
      <div className={`toybox-poster toybox-poster-${areas[active].key} ${animateEntrance ? "toybox-enter" : ""}`}>
        <div className="toybox-letter-field">
          {floatingLetters.map(({ letter, name }) => <span className={`toybox-letter toybox-letter-${name}`} key={name}>{letter}</span>)}
        </div>
        <span className="home-mascot home-mascot-boy" />
        <span className="home-mascot home-mascot-girl" />
      </div>
    </div>
    <div className="toybox-steps">
      {areas.map((area, index) => <article className={`toybox-step toybox-step-${area.key}`} key={area.key}>
        <div className="toybox-copy">
          <span className="home-kicker"><Heart size={17} aria-hidden="true" /> {area.eyebrow}</span>
          {index === 0 ? <h1>{area.heading}</h1> : <h2>{area.heading}</h2>}
          <p>{area.body}</p>
          <Link className={`home-button ${index % 2 ? "home-button-blue" : "home-button-pink"}`} to={area.path}>
            {area.action} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </article>)}
    </div>
  </section>;
}
