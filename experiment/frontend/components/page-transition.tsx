// Added transition animation
"use client";

import { usePathname } from "next/navigation";

// Added transition animation — cinematic two-phase curtain wipe
const PAGE_TRANSITION_STYLES = `
  /*
   * CURTAIN WIPE
   * Phase 1 (0% → 42%):  gradient curtain sweeps IN from the left, covering the screen.
   * Phase 2 (42% → 58%):  curtain holds — screen fully covered, new page is "loaded" behind it.
   * Phase 3 (58% → 100%): curtain sweeps OUT to the right, revealing the new page cleanly.
   * One element, one keyframe — no JS timing required.
   */
  @keyframes curtainWipe {
    0%   { clip-path: inset(0 100% 0 0); }
    42%  { clip-path: inset(0 0%   0 0); }
    58%  { clip-path: inset(0 0%   0 0); }
    100% { clip-path: inset(0 0% 0 100%); }
  }

  /*
   * CONTENT REVEAL
   * Stays invisible while the curtain is closed (0%–55%), then
   * fades + rises as the curtain exits.
   */
  @keyframes contentReveal {
    0%   { opacity: 0; transform: scale(1) translateY(0); }
    55%  { opacity: 0; transform: scale(0.992) translateY(6px); }
    100% { opacity: 1; transform: scale(1)   translateY(0); }
  }

  /*
   * SHIMMER PASS — a diagonal light streak that sweeps left→right
   * as the curtain lifts, adding a "high-end" material feel.
   */
  @keyframes shimmerPass {
    0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
    15%  { opacity: 0.6; }
    85%  { opacity: 0.6; }
    100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
  }

  /*
   * PROGRESS BAR — extends full-width then fades, like Linear / Vercel.
   */
  @keyframes barGrow {
    0%   { transform: scaleX(0); opacity: 1; }
    75%  { transform: scaleX(1); opacity: 1; }
    100% { transform: scaleX(1); opacity: 0; }
  }

  /* ─── curtain layer ─────────────────────────────────────────── */
  .pt-curtain {
    position: fixed;
    inset: 0;
    z-index: 9997;
    pointer-events: none;
    background: linear-gradient(
      110deg,
      #09090b 0%,
      #18184a 35%,
      #3730a3 60%,
      #6366f1 80%,
      #8b5cf6 100%
    );
    animation: curtainWipe 0.72s cubic-bezier(0.76, 0, 0.24, 1) both;
  }

  /* shimmer streak that rides on top of the curtain */
  .pt-shimmer {
    position: fixed;
    inset: 0;
    z-index: 9998;
    pointer-events: none;
    overflow: hidden;
  }
  .pt-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.07),
      rgba(255, 255, 255, 0.13),
      rgba(255, 255, 255, 0.07),
      transparent
    );
    animation: shimmerPass 0.72s cubic-bezier(0.76, 0, 0.24, 1) 0.1s both;
  }

  /* ─── progress bar ──────────────────────────────────────────── */
  .pt-bar {
    position: fixed;
    top: 0; left: 0;
    width: 100%;
    height: 2px;
    z-index: 9999;
    transform-origin: left center;
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa, #c4b5fd);
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.8), 0 0 3px rgba(99, 102, 241, 1);
    pointer-events: none;
    animation: barGrow 0.72s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /* ─── page content ──────────────────────────────────────────── */
  .pt-content {
    animation: contentReveal 0.72s cubic-bezier(0.16, 1, 0.3, 1) both;
    will-change: opacity, transform;
  }
`;

export function PageTransition({ children }: { children: React.ReactNode }) {
  // Added transition animation — pathname as key forces full re-mount on every
  // route change, automatically restarting all CSS animations from frame 0.
  const pathname = usePathname();

  return (
    <>
      {/* Added transition animation — keyframe & class definitions */}
      <style suppressHydrationWarning>{PAGE_TRANSITION_STYLES}</style>

      {/* Added transition animation — curtain that sweeps in then out */}
      <div key={`curtain-${pathname}`} className="pt-curtain" aria-hidden />

      {/* Added transition animation — shimmer streak riding on the curtain */}
      <div key={`shimmer-${pathname}`} className="pt-shimmer" aria-hidden />

      {/* Added transition animation — glowing top progress bar */}
      <div key={`bar-${pathname}`} className="pt-bar" aria-hidden />

      {/* Added transition animation — page content, hidden until curtain exits */}
      <div key={`content-${pathname}`} className="pt-content">
        {children}
      </div>
    </>
  );
}
