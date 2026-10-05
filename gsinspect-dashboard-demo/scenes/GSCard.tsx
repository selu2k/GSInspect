/*
ART DIRECTION
- Idea: the dashboard's own signature, a force-displacement curve, draws the
  brand on. Same picture opens and closes the demo, so the ending answers it.
- Ambition: clarity, product-grade polish (a calm SaaS explainer), not spectacle.
- Palette (from the app): ground #f1f5f9 / grid #e2e8f0, ink #0f172a, slate #64748b,
  brand blue #2563eb, curve colours the app uses: blue #3b82f6, emerald #10b981, amber #f59e0b.
- Type: Outfit (bundled) — geometric, close to the app's UI sans.
- Tempo: intro 4.0 s — grid fades 0–0.6, curves draw 0.2–2.4 (staggered 0.12 s),
  logo pops 0.5, title letters 0.7–1.3, subtitle 1.2–1.7, slow push-in throughout.
  Outro: same build, with a closing line instead of the subtitle.
- Sections: one shot; beat = premise (intro) / sign-off (outro); family = line and
  path + kinetic type; transition = crossfade into / out of the screen recording.
*/
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBundledFonts } from '@adal/fonts';

// local helpers: 0..1 progress of a window, interpolation, seeded random
const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const rand = (s: number) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

// local easings (0..1 -> 0..1)
const E = {
  outCubic: (k: number) => 1 - Math.pow(1 - k, 3),
  inOutCubic: (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  inOutSine: (k: number) => -(Math.cos(Math.PI * k) - 1) / 2,
  outExpo: (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  outBack: (k: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
};

export const compositionConfig = {
  id: 'GSCard',
  fps: 30,
  durationInFrames: 120,
  width: 1920,
  height: 1080,
  defaultProps: {
    variant: 'intro',
    title: 'GSInspect',
    kicker: 'Ground Support',
    line: 'Rockbolt test data, compared side by side',
  },
};

const W = 1920, H = 1080;
const PLOT = { x0: 140, x1: 1780, y0: 960, y1: 300 }; // chart area (y0 = baseline)

// rockbolt-like load curve: steep rise, peak, settle to a noisy plateau, gentle decline
function curvePoints(seed: number, peak: number, plateau: number) {
  const pts: [number, number][] = [];
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    let v: number;
    if (u < 0.06) v = peak * E.outCubic(u / 0.06);
    else if (u < 0.16) v = lerp(peak, plateau, E.inOutSine((u - 0.06) / 0.1));
    else v = plateau * (1 - 0.18 * Math.pow((u - 0.16) / 0.84, 1.6));
    v += (rand(seed * 1000 + i) - 0.5) * 0.035 + Math.sin(u * 40 + seed) * 0.01;
    const x = lerp(PLOT.x0, PLOT.x1, u);
    const y = lerp(PLOT.y0, PLOT.y1, Math.max(0, v));
    pts.push([x, y]);
  }
  return pts;
}
const toPath = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const pathLen = (pts: [number, number][]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

const CURVES = [
  { seed: 3, peak: 0.92, plateau: 0.74, color: '#f59e0b' },
  { seed: 7, peak: 0.84, plateau: 0.66, color: '#10b981' },
  { seed: 11, peak: 0.78, plateau: 0.6, color: '#3b82f6' },
  { seed: 17, peak: 0.7, plateau: 0.55, color: '#3b82f6' },
  { seed: 23, peak: 0.88, plateau: 0.7, color: '#10b981' },
].map(c => { const pts = curvePoints(c.seed, c.peak, c.plateau); return { ...c, d: toPath(pts), len: pathLen(pts) }; });

const Pulse: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
  </svg>
);

export const GSCard: React.FC<{ variant?: string; title?: string; kicker?: string; line?: string }> = ({
  variant = 'intro', title = 'GSInspect', kicker = 'Ground Support', line = 'Rockbolt test data, compared side by side',
}) => {
  useBundledFonts();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;

  const push = lerp(1.0, 1.045, E.inOutSine(Math.min(1, t / dur)));
  const gridA = seg(t, 0, 0.6);
  const logoK = seg(t, 0.45, 1.0);
  const logoS = 0.6 + 0.4 * E.outBack(logoK);
  const subK = E.outCubic(seg(t, 1.2, 1.75));
  const pillK = E.outCubic(seg(t, 1.0, 1.5));

  // gentle continuous drift of the curve layer (parallax vs the type)
  const drift = Math.sin(t * 0.9) * 6;

  return (
    <AbsoluteFill style={{ background: '#f8fafc', fontFamily: 'Outfit, sans-serif', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        {/* chart grid */}
        <svg width={W} height={H} style={{ position: 'absolute', opacity: gridA * 0.9 }}>
          {Array.from({ length: 9 }).map((_, i) => {
            const x = lerp(PLOT.x0, PLOT.x1, i / 8);
            return <line key={'v' + i} x1={x} x2={x} y1={PLOT.y1 - 60} y2={PLOT.y0} stroke="#e2e8f0" strokeWidth={2} strokeDasharray="8 8" />;
          })}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = lerp(PLOT.y0, PLOT.y1 - 60, i / 4);
            return <line key={'h' + i} x1={PLOT.x0} x2={PLOT.x1} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={2} strokeDasharray="8 8" />;
          })}
          <line x1={PLOT.x0} x2={PLOT.x1} y1={PLOT.y0} y2={PLOT.y0} stroke="#cbd5e1" strokeWidth={3} />
        </svg>
        {/* curves draw on */}
        <svg width={W} height={H} style={{ position: 'absolute', transform: `translateY(${drift}px)` }}>
          {CURVES.map((c, i) => {
            const k = E.inOutCubic(seg(t, 0.2 + i * 0.12, 2.3 + i * 0.12));
            return (
              <path key={i} d={c.d} fill="none" stroke={c.color} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round"
                strokeDasharray={c.len} strokeDashoffset={c.len * (1 - k)} opacity={0.32} />
            );
          })}
        </svg>
        {/* soft wash so type sits on a calm ground */}
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse 52% 46% at 50% 47%, rgba(248,250,252,0.97) 0%, rgba(248,250,252,0.85) 55%, rgba(248,250,252,0) 100%)' }} />
      </AbsoluteFill>

      {/* brand block */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34, transform: 'translateY(-30px)' }}>
          <div style={{
            width: 132, height: 132, borderRadius: 30, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 18px 40px rgba(37,99,235,0.35)', transform: `scale(${logoS})`, opacity: Math.min(1, logoK * 2),
          }}>
            <Pulse size={78} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', fontSize: 128, fontWeight: 700, color: '#0f172a', letterSpacing: -3, lineHeight: 1 }}>
              {title.split('').map((ch, i) => {
                const k = E.outExpo(seg(t, 0.7 + i * 0.045, 1.25 + i * 0.045));
                return <span key={i} style={{ display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 46}px)` }}>{ch}</span>;
              })}
            </div>
            <div style={{
              marginTop: 16, fontSize: 30, fontWeight: 500, color: '#475569', background: '#e2e8f0',
              padding: '6px 20px', borderRadius: 999, opacity: pillK, transform: `translateX(${(1 - pillK) * -24}px)`,
            }}>{kicker}</div>
          </div>
        </div>
        <div style={{
          marginTop: 54, fontSize: 46, fontWeight: 500, color: variant === 'outro' ? '#1d4ed8' : '#334155',
          opacity: subK, transform: `translateY(${(1 - subK) * 22}px) translateY(-30px)`, letterSpacing: -0.5,
        }}>{line}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
