// A soft passage between two homepage sections: a bloom of brand colour with a few specks of light twinkling round it.
const specks = [
  { x: 27, y: 14, delay: "0s" },
  { x: 39, y: 23, delay: "-1.2s" },
  { x: 60, y: 28, delay: "-2.6s" },
  { x: 82, y: 30, delay: "-0.6s" },
  { x: 40, y: 92, delay: "-3.4s" },
  { x: 56, y: 88, delay: "-1.9s" },
  { x: 72, y: 58, delay: "-4.1s" },
  { x: 18, y: 64, delay: "-2.2s" },
];

export default function SectionGlow() {
  return <div className="section-glow" aria-hidden="true">
    <span className="section-glow-bloom" />
    <span className="section-glow-line" />
    <span className="section-glow-specks">
      {specks.map((speck) => <span key={speck.delay} style={{ insetInlineStart: `${speck.x}%`, top: `${speck.y}%`, animationDelay: speck.delay }} />)}
    </span>
  </div>;
}
