import React from "react";
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing, random} from "remotion";
import {MONT, PLAY, HAND, TYPE, useDims, TEMA} from "./lib";
import {loadFont as loadAnton} from "@remotion/google-fonts/Anton";
import assets from "./data/assets.json";
export const ANTON = loadAnton("normal", {weights: ["400"], subsets: ["latin", "latin-ext"]}).fontFamily;

export const PAPER = "#efe3ca";
export const PAPER2 = "#e2d0ae";
export const INK = "#1c1712";
export const INK2 = "#463c31";
export const RED = "#c81e26";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const img = (id: string) => staticFile(id.startsWith("v") ? `voxp/${id}.jpg` : `img/${id}.jpg`);
const photoSrc = (id: string, tone?: string) => staticFile(id.startsWith("v") ? `voxp/${id}.jpg` : tone === "bw" ? `imgp/${id}_b.jpg` : `imgp/${id}_s.jpg`);

/* ------------------------------------------------------------------ aleatório estável */
const h = (s: string) => {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return ((x >>> 0) % 10000) / 10000;
};
const jit = (s: string, a = 1) => (h(s) - 0.5) * 2 * a;

/* ------------------------------------------------------------------ bordas rasgadas */
const clipTorn = (seed: string, n = 18, depth = 1.1) => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${jit(seed + "t" + i, depth)}%`);
  for (let i = 0; i <= n; i++) pts.push(`${100 + jit(seed + "r" + i, depth)}% ${(i / n) * 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 + jit(seed + "b" + i, depth)}%`);
  for (let i = n; i >= 0; i--) pts.push(`${jit(seed + "l" + i, depth)}% ${(i / n) * 100}%`);
  return `polygon(${pts.join(",")})`;
};

/* ------------------------------------------------------------------ textura global */
export const VoxGrain: React.FC<{op?: number}> = ({op = 0.16}) => {
  const fr = useCurrentFrame();
  const x = Math.floor(random("gx" + fr) * 100), y = Math.floor(random("gy" + fr) * 100);
  return (
    <AbsoluteFill style={{pointerEvents: "none", opacity: op, mixBlendMode: "multiply"}}>
      <Img src={staticFile("fx/grao0.png")} style={{width: "100%", height: "100%", objectFit: "cover", transform: `translate(${x}px,${y}px) scale(1.06)`}} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{v?: number}> = ({v = 0.55}) => (
  <AbsoluteFill style={{pointerEvents: "none", background: `radial-gradient(ellipse at 50% 46%, transparent 42%, rgba(24,16,10,${v * 0.55}) 78%, rgba(12,8,5,${v}) 100%)`}} />
);

/* ------------------------------------------------------------------ folha de papel */
export const Paper: React.FC<{
  x?: number; y?: number; w?: number; h?: number; rot?: number; seed: string; bg?: string;
  torn?: boolean; at?: number; z?: number; children?: React.ReactNode; shadow?: number; style?: React.CSSProperties;
}> = ({x = 0.5, y = 0.5, w = 0.5, h = 0.4, rot = 0, seed, bg = PAPER, torn = true, at = 0, z = 1, children, shadow = 1, style}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {fps} = useVideoConfig();
  const {W, H} = useDims();
  if (fr < -2) return null;
  const sp = spring({frame: Math.max(0, fr), fps, config: {damping: 15, stiffness: 140, mass: 0.7}});
  const r = rot + jit(seed, 1.1);
  return (
    <div style={{position: "absolute", left: W * x, top: H * y, width: W * w, height: H * h, zIndex: z,
      transform: `translate(-50%,-50%) translateY(${(1 - sp) * 26}px) rotate(${r}deg) scale(${0.94 + sp * 0.06})`, opacity: Math.min(1, sp * 1.3)}}>
      <div style={{position: "absolute", inset: 0, background: bg, clipPath: torn ? clipTorn(seed) : undefined,
        boxShadow: shadow ? `0 ${18 * shadow}px ${40 * shadow}px rgba(20,12,6,${0.32 * shadow}), 0 2px 0 rgba(255,255,255,.35) inset` : undefined,
        }} />
      <Img src={staticFile("vox/v16.jpg")} style={{position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.28,
        mixBlendMode: "multiply", clipPath: torn ? clipTorn(seed) : undefined}} />
      <div style={{position: "absolute", inset: 0, clipPath: torn ? clipTorn(seed) : undefined, overflow: "hidden"}}>{children}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ fita adesiva */
export const Tape: React.FC<{x: number; y: number; w?: number; rot?: number; at?: number; dark?: boolean}> = ({x, y, w = 0.16, rot = 0, at = 0, dark}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const o = interpolate(fr, [0, 5], [0, 1], clamp);
  return (
    <div style={{position: "absolute", left: W * x, top: H * y, width: W * w, height: H * 0.045, transform: `translate(-50%,-50%) rotate(${rot}deg) scaleX(${0.6 + o * 0.4})`,
      opacity: o * (dark ? 0.55 : 0.72), background: dark ? "linear-gradient(100deg,#8b7a58,#d9c9a4 40%,#a8966f)" : "linear-gradient(100deg,#cdbb92,#f3e8c9 40%,#d7c6a0)",
      clipPath: "polygon(2% 0,98% 3%,100% 50%,97% 100%,3% 97%,0 48%)", boxShadow: "0 2px 4px rgba(0,0,0,.15)", mixBlendMode: "multiply", zIndex: 8}} />
  );
};

/* ------------------------------------------------------------------ tachinha */
export const Pin: React.FC<{x: number; y: number; at?: number; color?: string; s?: number}> = ({x, y, at = 0, color = "#b8171e", s = 1}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H, V} = useDims();
  if (fr < 0) return null;
  const p = spring({frame: fr, fps: 30, config: {damping: 9, stiffness: 200}});
  const d = (V ? W : H * 0.55) * 0.022 * s;
  return (
    <div style={{position: "absolute", left: W * x, top: H * y, width: d, height: d, transform: `translate(-40%,-60%) scale(${0.4 + p * 0.6})`, zIndex: 20}}>
      <div style={{position: "absolute", left: d * 0.1, top: d * 0.55, width: d * 0.8, height: d * 0.3, borderRadius: "50%", background: "rgba(30,18,8,.35)", filter: "blur(3px)"}} />
      <div style={{width: d, height: d, borderRadius: "50%", background: `radial-gradient(circle at 34% 30%, #fff8 0 12%, ${color} 38%, #5c0a0e 78%, #2a0406 100%)`,
        boxShadow: "0 3px 6px rgba(0,0,0,.5), inset -2px -3px 5px rgba(0,0,0,.5)"}} />
      <div style={{position: "absolute", left: d * 0.34, top: d * 0.12, width: d * 0.16, height: d * 0.16, borderRadius: "50%", background: "#fff9", filter: "blur(1px)"}} />
    </div>
  );
};

/* ------------------------------------------------------------------ seta desenhada à mão */
export const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; at?: number; color?: string; w?: number; curve?: number}> = ({x1, y1, x2, y2, at = 0, color = RED, w = 5, curve = 0.3}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const d = interpolate(fr, [0, 12], [600, 0], clamp);
  const mx = (x1 + x2) / 2 + (y2 - y1) * curve, my = (y1 + y2) / 2 - (x2 - x1) * curve;
  const P = (px: number, py: number) => `${W * px},${H * py}`;
  return (
    <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none", zIndex: 15, overflow: "visible"}}>
      <path d={`M${P(x1, y1)} Q${P(mx, my)} ${P(x2, y2)}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={2400} strokeDashoffset={d}
        style={{filter: "drop-shadow(0 2px 2px rgba(0,0,0,.25))"}} />
      <path d={`M${W * x2},${H * y2} l${-W * 0.035},${-H * 0.028} M${W * x2},${H * y2} l${W * 0.012},${-H * 0.042}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round"
        strokeDasharray={200} strokeDashoffset={d > 100 ? 200 : 0} />
    </svg>
  );
};

/* ------------------------------------------------------------------ linha/rabisco */
export const Scribble: React.FC<{x: number; y: number; w: number; at?: number; color?: string; thin?: boolean}> = ({x, y, w, at = 0, color = RED, thin}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const p = interpolate(fr, [0, 9], [0, 1], clamp);
  return (
    <svg width={W * w} height={H * 0.05} viewBox="0 0 400 40" style={{position: "absolute", left: W * x, top: H * y, zIndex: 14, overflow: "visible"}}>
      <path d="M4 24 C 90 8, 180 34, 396 16" fill="none" stroke={color} strokeWidth={thin ? 5 : 10} strokeLinecap="round" pathLength={1}
        strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.9} />
    </svg>
  );
};

/* ------------------------------------------------------------------ círculo de caneta */
export const CircleMark: React.FC<{x: number; y: number; w: number; h?: number; at?: number; color?: string}> = ({x, y, w, h = 0.16, at = 0, color = RED}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const p = interpolate(fr, [0, 11], [0, 1], clamp);
  return (
    <svg width={W * w * 1.3} height={H * h * 1.5} style={{position: "absolute", left: W * x - W * w * 0.15, top: H * y - H * h * 0.25, zIndex: 14, overflow: "visible"}}>
      <ellipse cx="50%" cy="50%" rx={W * w * 0.5} ry={H * h * 0.5} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} transform={`rotate(${jit("c" + x, 8)} ${W * w * 0.65} ${H * h * 0.75})`} opacity={0.85} />
    </svg>
  );
};

/* ------------------------------------------------------------------ carimbo */
export const StampMark: React.FC<{t: string; x: number; y: number; rot?: number; at?: number; color?: string; size?: number; rare?: boolean}> = ({t, x, y, rot = -11, at = 0, color = RED, size = 78, rare}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const sp = spring({frame: fr, fps: 30, config: {damping: 9, stiffness: 260, mass: 0.5}});
  const sc = interpolate(sp, [0, 1], [2.1, 1]);
  const op = interpolate(fr, [0, 3], [0, 1], clamp);
  return (
    <div style={{position: "absolute", left: W * x, top: H * y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${sc})`, opacity: op * 0.92, zIndex: 22}}>
      <div style={{border: `${Math.max(3, size * 0.075)}px solid ${color}`, borderRadius: size * 0.12, padding: `${size * 0.08}px ${size * 0.28}px`,
        fontFamily: MONT, fontWeight: 900, fontSize: size, color, letterSpacing: size * 0.06, textTransform: "uppercase", whiteSpace: "nowrap",
        background: rare ? "rgba(255,255,255,.04)" : "rgba(255,248,230,.10)", boxShadow: `0 0 0 ${size * 0.02}px ${color} inset`, filter: "contrast(1.05)"}}>
        {t}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ manchete em tira de papel */
export const Headline: React.FC<{
  kicker?: string; head: string; line?: string; x?: number; y?: number; w?: number; at?: number;
  align?: "center" | "left"; size?: number; paper?: boolean; dark?: boolean; rot?: number;
}> = ({kicker, head, line, x = 0.5, y = 0.5, w = 0.56, at = 0, align = "center", size = 1, paper = true, dark = false, rot = 0}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H, V} = useDims();
  if (fr < 0) return null;
  const sp = spring({frame: fr, fps: 30, config: {damping: 16, stiffness: 150}});
  const base = V ? W * 0.085 : H * 0.082;
  const lines = head.split("\n");
  return (
    <div style={{position: "absolute", left: W * x, top: H * y, width: W * w, transform: `translate(-50%,-50%) translateY(${(1 - sp) * 30}px) rotate(${rot}deg)`, zIndex: 18}}>
      {paper && <div style={{position: "absolute", inset: `${-H * 0.035}px ${-W * 0.035}px`, background: dark ? "#221c15" : PAPER, clipPath: clipTorn("hl" + head, 14, 2.2),
        boxShadow: "0 20px 45px rgba(15,9,4,.42)", transform: `rotate(${jit(head, 0.9)}deg)`}} />}
      {paper && <Img src={staticFile("vox/v16.jpg")} style={{position: "absolute", inset: `${-H * 0.035}px ${-W * 0.035}px`, width: `calc(100% + ${W * 0.07}px)`, height: `calc(100% + ${H * 0.07}px)`,
        objectFit: "cover", opacity: 0.22, mixBlendMode: "multiply", clipPath: clipTorn("hl" + head, 14, 2.2)}} />}
      <div style={{position: "relative", padding: `${H * 0.028}px ${W * 0.03}px`, textAlign: align}}>
        {kicker && <div style={{display: "inline-block", background: RED, color: "#fff6e6", fontFamily: MONT, fontWeight: 900, fontSize: base * 0.3, letterSpacing: base * 0.055,
          padding: `${base * 0.05}px ${base * 0.16}px`, marginBottom: base * 0.16, transform: "rotate(-1.4deg)"}}>{kicker}</div>}
        <div style={{fontFamily: ANTON, fontWeight: 400, fontSize: base * size * 1.02, lineHeight: 0.92, color: dark ? "#f2e6cd" : INK, textTransform: "uppercase", letterSpacing: base * 0.004}}>
          {lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        {line && <div style={{fontFamily: TYPE, fontSize: base * 0.29, lineHeight: 1.28, color: dark ? "#cbbfa6" : INK2, marginTop: base * 0.18}}>{line}</div>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ etiqueta / legenda */
export const Caption: React.FC<{t: string; x: number; y: number; at?: number; w?: number; align?: "left" | "center"; color?: string; font?: "type" | "hand"; size?: number; box?: boolean}> = ({t, x, y, at = 0, w = 0.3, align = "left", color = INK2, font = "type", size = 1, box}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H, V} = useDims();
  if (fr < 0) return null;
  const o = interpolate(fr, [0, 6], [0, 1], clamp);
  const shown = t;
  return (
    <div style={{position: "absolute", left: W * x, top: H * y, width: W * w, transform: `translate(-50%,0) rotate(${box ? jit(t, 0.8) : 0}deg)`, opacity: o, textAlign: align, zIndex: 17,
      background: box ? "rgba(243,233,211,.94)" : undefined, padding: box ? `${H * 0.012}px ${W * 0.012}px` : undefined,
      boxShadow: box ? "0 10px 26px rgba(20,10,4,.28)" : undefined, clipPath: box ? clipTorn("cap" + t, 10, 2.2) : undefined}}>
      <div style={{fontFamily: font === "hand" ? HAND : TYPE, fontSize: (V ? W : H) * 0.0205 * size, lineHeight: 1.3, color, letterSpacing: font === "type" ? 0.4 : 0,
        textShadow: "0 1px 0 rgba(255,255,255,.35)"}}>
        {shown}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ foto com moldura / recorte */
export const Photo: React.FC<{
  src: string; x?: number; y?: number; w?: number; rot?: number; at?: number; frame?: "print" | "polaroid" | "news" | "none" | "torn";
  tone?: "sepia" | "bw" | "none" | "warm"; tape?: boolean; pin?: boolean; z?: number; caption?: string; seed?: string; par?: number;
}> = ({src, x = 0.5, y = 0.5, w = 0.4, rot = 0, at = 0, frame = "print", tone = "sepia", tape = true, pin = false, z = 5, caption, seed, par = 0}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {fps} = useVideoConfig();
  const {W, H} = useDims();
  if (fr < -1) return null;
  const s = spring({frame: Math.max(0, fr), fps, config: {damping: 13, stiffness: 120, mass: 0.9}});
  const r = rot + jit(seed || src, 1.3);
  const psrc = tone === "bw" || tone === "sepia" ? photoSrc(src, tone) : img(src);
  const border = frame === "polaroid" ? H * 0.018 : frame === "print" ? H * 0.012 : 0;
  const ar = Math.min(1.5, Math.max(0.62, (assets as any)[src]?.a || 1.45));
  let pw = Math.min(W * w, W * 0.66);
  if (frame !== "none" && pw / ar > H * 0.76) pw = H * 0.76 * ar;
  const ph = frame === "polaroid" ? pw / ar + H * 0.035 : pw / ar;
  return (
    <div style={{position: "absolute", left: W * x, top: H * y, width: pw, zIndex: z, transformOrigin: "50% 20%",
      transform: `translate(-50%,-50%) translateY(${(1 - s) * 40}px) rotate(${r}deg) scale(${0.9 + s * 0.1})`, opacity: Math.min(1, s * 1.4)}}>
      {pin && <div style={{position: "absolute", left: "48%", top: "-3%", width: H * 0.032, height: H * 0.032, borderRadius: "50%", zIndex: 3,
        background: "radial-gradient(circle at 34% 30%, #fff8 0 12%, #b8171e 38%, #5c0a0e 78%, #2a0406 100%)", boxShadow: "0 3px 6px rgba(0,0,0,.5)"}} />}
      <div style={{position: "relative", background: frame === "news" ? "#ddd2ba" : "#f6efdd", padding: border,
        clipPath: frame === "torn" ? clipTorn(seed || src, 16, 1.6) : undefined,
        boxShadow: frame === "none" ? "0 24px 50px rgba(0,0,0,.42)" : "0 26px 50px rgba(20,10,4,.42), 0 2px 4px rgba(0,0,0,.2)"}}>
        <div style={{position: "relative", width: "100%", height: ph, overflow: "hidden", background: "#3a3129"}}>
          <Img src={psrc} style={{width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${1.16 + par * 0.04}) translate(${(fr * 0.05) * (1 + par)}px, ${fr * 0.02}px)`, transformOrigin: "50% 45%"}} />
          {frame === "news" && <AbsoluteFill style={{background: "repeating-radial-gradient(circle at 0 0, rgba(0,0,0,.30) 0 1px, transparent 1.2px 3px)", opacity: 0.35, mixBlendMode: "multiply"}} />}
          <AbsoluteFill style={{boxShadow: "inset 0 0 40px rgba(40,24,10,.35)"}} />
        </div>
        {frame === "polaroid" && caption && (
          <div style={{height: H * 0.038, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HAND, fontSize: H * 0.026, color: "#3b332a"}}>{caption}</div>
        )}
      </div>
      {tape && <div style={{position: "absolute", left: "4%", top: "-3%", width: "34%", height: H * 0.038, transform: "rotate(-9deg)", opacity: 0.75,
        background: "linear-gradient(100deg,#cdbb92,#f3e8c9 40%,#d7c6a0)", clipPath: "polygon(2% 0,98% 3%,100% 50%,97% 100%,3% 97%,0 48%)", mixBlendMode: "multiply"}} />}
      {tape && <div style={{position: "absolute", right: "2%", bottom: "-3%", width: "30%", height: H * 0.034, transform: "rotate(6deg)", opacity: 0.75,
        background: "linear-gradient(100deg,#cdbb92,#f3e8c9 40%,#d7c6a0)", clipPath: "polygon(2% 0,98% 3%,100% 50%,97% 100%,3% 97%,0 48%)", mixBlendMode: "multiply"}} />}
    </div>
  );
};

/* ------------------------------------------------------------------ filme / recorte de jornal */
export const Clipping: React.FC<{src: string; x?: number; y?: number; w?: number; rot?: number; at?: number; label?: string; torn?: boolean}> = ({src, x = 0.5, y = 0.5, w = 0.34, rot = 0, at = 0, label, torn = true}) => (
  <Photo src={src} x={x} y={y} w={w} rot={rot} at={at} frame="torn" tone="bw" tape={false} z={7} />
);

/* ------------------------------------------------------------------ recorte do documento */
export const DocShot: React.FC<{src: string; x?: number; y?: number; w?: number; rot?: number; at?: number; marks?: [number, number, number, number][]}> = ({src, x = 0.5, y = 0.5, w = 0.42, rot = 0, at = 0, marks = []}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const s = spring({frame: fr, fps: 30, config: {damping: 14}});
  return (
    <div style={{position: "absolute", left: W * x, top: H * y, width: W * w, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${0.94 + s * 0.06})`, zIndex: 9,
      background: "#f7f0de", padding: H * 0.012, boxShadow: "0 30px 60px rgba(20,10,4,.5)"}}>
      <div style={{position: "relative"}}>
        <Img src={img(src)} style={{width: "100%", display: "block", filter: "sepia(.22) contrast(1.04)"}} />
        {marks.map(([mx, my, mw, mh], i) => {
          const g = interpolate(fr, [8 + i * 8, 14 + i * 8], [0, 1], clamp);
          return <div key={i} style={{position: "absolute", left: `${mx}%`, top: `${my}%`, width: `${mw * g}%`, height: `${mh}%`, background: "#ffe14d", mixBlendMode: "multiply", opacity: 0.75}} />;
        })}
      </div>
      <Tape x={0.2} y={0} w={0.26} rot={-8} />
    </div>
  );
};

/* ------------------------------------------------------------------ faixa de filme */
export const Filmstrip: React.FC<{y: number; at?: number; h?: number; speed?: number; reverse?: boolean}> = ({y, at = 0, h = 0.085, speed = 1, reverse}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const imgs = ["i03", "i31", "i22", "i16", "i04", "i39", "i10", "i28"];
  const off = ((fr * speed * 3) % 100) / 100;
  return (
    <div style={{position: "absolute", left: 0, right: 0, top: H * y, height: H * h, transform: "translateY(-50%) rotate(-2.2deg) scale(1.06)", zIndex: 4, overflow: "hidden",
      background: "#171310", boxShadow: "0 12px 30px rgba(0,0,0,.5)", opacity: 0.72}}>
      <div style={{position: "absolute", inset: 0, display: "flex", gap: H * 0.006, transform: `translateX(${(reverse ? 1 : -1) * off * W * 0.6}px)`}}>
        {[...imgs, ...imgs].map((s, i) => (
          <div key={i} style={{width: W * 0.17, height: "100%", flexShrink: 0, overflow: "hidden", border: `${H * 0.006}px solid #0c0a08`}}>
            <Img src={img(s)} style={{width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.15) brightness(.78) sepia(.25)"}} />
          </div>
        ))}
      </div>
      <div style={{position: "absolute", top: 0, bottom: 0, left: 0, right: 0, background: "repeating-linear-gradient(90deg, transparent 0 34px, #0b0907 34px 44px)", opacity: 0.9}} />
      <div style={{position: "absolute", top: 0, bottom: 0, left: 0, right: 0, boxShadow: "inset 0 0 60px rgba(0,0,0,.85)"}} />
    </div>
  );
};

/* ------------------------------------------------------------------ fita de evidência */
export const EvidenceTape: React.FC<{y: number; t?: string; at?: number; rot?: number; color?: string}> = ({y, t = "EVIDÊNCIA", at = 0, rot = -7, color = "#f2c400"}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const p = interpolate(fr, [0, 8], [0, 1], clamp);
  return (
    <div style={{position: "absolute", left: W * 0.5, top: H * y, width: W * 1.2, height: H * 0.075, transform: `translate(-50%,-50%) rotate(${rot}deg) scaleX(${0.7 + p * 0.3})`, zIndex: 16,
      background: color, display: "flex", alignItems: "center", justifyContent: "center", opacity: p, boxShadow: "0 6px 14px rgba(0,0,0,.35)"}}>
      <div style={{fontFamily: MONT, fontWeight: 900, fontSize: H * 0.038, letterSpacing: H * 0.012, color: "#1b1408", whiteSpace: "nowrap"}}>
        {`${t}   •   ${t}   •   ${t}`}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ número gigante */
export const BigNumber: React.FC<{n: string; sub?: string; x?: number; y?: number; at?: number; size?: number; color?: string}> = ({n, sub, x = 0.5, y = 0.46, at = 0, size = 1, color = INK}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const sp = spring({frame: fr, fps: 30, config: {damping: 12, stiffness: 120}});
  return (
    <div style={{position: "absolute", left: W * x, top: H * y, transform: `translate(-50%,-50%) scale(${0.8 + sp * 0.2})`, textAlign: "center", zIndex: 18}}>
      <div style={{fontFamily: PLAY, fontWeight: 900, fontSize: H * 0.34 * size, lineHeight: 0.9, color, letterSpacing: -H * 0.01, textShadow: "0 4px 0 rgba(255,255,255,.25)"}}>{n}</div>
      {sub && <div style={{fontFamily: MONT, fontWeight: 800, fontSize: H * 0.032, letterSpacing: H * 0.008, color: INK2, textTransform: "uppercase", marginTop: H * 0.012}}>{sub}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------ capitulo */
export const ChapterCard: React.FC<{n: number; t: string; sub?: string; at?: number}> = ({n, t, sub, at = 0}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const sp = spring({frame: fr, fps: 30, config: {damping: 16}});
  return (
    <AbsoluteFill style={{justifyContent: "center", alignItems: "center", zIndex: 20}}>
      <div style={{transform: `rotate(-2deg) scale(${0.92 + sp * 0.08})`, textAlign: "center"}}>
        <div style={{fontFamily: MONT, fontWeight: 900, fontSize: H * 0.022, letterSpacing: H * 0.014, color: RED}}>CAPÍTULO {String(n).padStart(2, "0")}</div>
        <div style={{fontFamily: ANTON, fontWeight: 400, fontSize: H * 0.1, lineHeight: 0.94, color: INK, marginTop: H * 0.012, textTransform: "uppercase", maxWidth: W * 0.8}}>{t}</div>
        {sub && <div style={{fontFamily: TYPE, fontSize: H * 0.03, color: INK2, marginTop: H * 0.02}}>{sub}</div>}
      </div>
      <Scribble x={0.28} y={0.66} w={0.44} at={at + 0.25} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ fundo */
export const PaperBG: React.FC<{src?: string; dark?: number; drift?: number; tone?: "warm" | "cool" | "red" | "dark"}> = ({src = "v06", dark = 0.18, drift = 6, tone = "warm"}) => {
  const fr = useCurrentFrame();
  const {W, H} = useDims();
  const t = fr / 30;
  const filt = tone === "red" ? "brightness(.55) saturate(1.35)" : tone === "dark" ? "brightness(.42)" : "none";
  return (
    <AbsoluteFill style={{overflow: "hidden", background: "#cbb997"}}>
      <Img src={img(src)} style={{position: "absolute", inset: "-6%", width: "112%", height: "112%", objectFit: "cover", filter: filt,
        transform: `scale(${1.06 + Math.sin(t * 0.2) * 0.01}) translate(${Math.sin(t * 0.12) * drift}px, ${Math.cos(t * 0.1) * drift * 0.6}px)`}} />
      <AbsoluteFill style={{background: `linear-gradient(120deg, rgba(255,244,220,.18), transparent 45%, rgba(60,36,16,.22))`}} />
      <AbsoluteFill style={{backgroundColor: `rgba(24,14,6,${dark})`, mixBlendMode: "multiply"}} />
    </AbsoluteFill>
  );
};

export const DarkBG: React.FC = () => {
  const fr = useCurrentFrame();
  const {W, H} = useDims();
  return (
    <AbsoluteFill style={{overflow: "hidden", background: "#0d0b09"}}>
      <Img src={img("v00")} style={{width: "100%", height: "100%", objectFit: "cover", opacity: 0.5, filter: "grayscale(.5) contrast(1.2) brightness(.5)",
        transform: `scale(${1.08 + fr * 0.00015})`}} />
      <AbsoluteFill style={{background: "radial-gradient(circle at 50% 40%, rgba(200,30,38,.16), transparent 55%)"}} />
      <Vignette v={0.75} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ moldura de câmera */
export const Camera: React.FC<{children: React.ReactNode; z?: [number, number]; x?: [number, number]; shake?: number; rot?: number}> = ({children, z = [1.02, 1.08], x = [0, 0], shake = 0, rot = 0}) => {
  const fr = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const p = Math.min(1, fr / Math.max(1, durationInFrames - 1));
  const e = Easing.bezier(0.3, 0.1, 0.3, 1)(p);
  const sx = shake ? (random("sx" + fr) - 0.5) * shake : 0;
  const sy = shake ? (random("sy" + fr) - 0.5) * shake : 0;
  return (
    <AbsoluteFill style={{transform: `scale(${interpolate(e, [0, 1], z)}) translate(${interpolate(e, [0, 1], x) + sx}px, ${sy}px) rotate(${rot}deg)`, transformOrigin: "50% 50%"}}>
      {children}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ varredura de papel entre planos */
export const PaperWipe: React.FC<{at: number; dur?: number; dir?: 1 | -1; on?: "dark" | "light"}> = ({at, dur = 0.45, dir = 1, on = "light"}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  const total = Math.round(dur * 30);
  if (fr < 0 || fr > total) return null;
  const p = fr / total;
  const x = dir > 0 ? interpolate(p, [0, 1], [-120, 120]) : interpolate(p, [0, 1], [120, -120]);
  return (
    <div style={{position: "absolute", top: -H * 0.12, bottom: -H * 0.12, left: `${x}%`, width: "34%", background: on === "dark" ? "#161210" : PAPER,
      transform: "rotate(4deg)", boxShadow: "0 0 90px rgba(0,0,0,.5)", zIndex: 40, clipPath: clipTorn("wipe", 10, 4)}}>
      <Img src={staticFile("vox/v16.jpg")} style={{width: "100%", height: "100%", objectFit: "cover", opacity: 0.35, mixBlendMode: "multiply"}} />
    </div>
  );
};

/* ------------------------------------------------------------------ etiqueta de arquivo */
export const FileLabel: React.FC<{t: string; x?: number; y?: number; at?: number; rot?: number}> = ({t, x = 0.14, y = 0.12, at = 0, rot = -3}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const o = interpolate(fr, [0, 6], [0, 1], clamp);
  return (
    <div style={{position: "absolute", left: W * x, top: H * y, transform: `translate(-50%,-50%) rotate(${rot}deg)`, background: "#e8d6ae", padding: `${H * 0.008}px ${W * 0.012}px`,
      border: "1px solid rgba(60,40,20,.35)", boxShadow: "0 3px 8px rgba(0,0,0,.18)", opacity: o, zIndex: 19}}>
      <span style={{fontFamily: TYPE, fontSize: H * 0.018, color: "#4a3b2a", letterSpacing: 1.5}}>{t}</span>
    </div>
  );
};

/* ------------------------------------------------------------------ marca-texto */
export const Highlight: React.FC<{x: number; y: number; w: number; h?: number; at?: number; color?: string}> = ({x, y, w, h = 0.035, at = 0, color = "rgba(255,225,77,.55)"}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const p = interpolate(fr, [0, 8], [0, 1], clamp);
  return <div style={{position: "absolute", left: W * x, top: H * y, width: W * w * p, height: H * h, background: color, mixBlendMode: "multiply", zIndex: 13, transform: "rotate(-1deg)"}} />;
};

/* ------------------------------------------------------------------ barra de censura */
export const Redact: React.FC<{x: number; y: number; w: number; h?: number; at?: number}> = ({x, y, w, h = 0.03, at = 0}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const p = interpolate(fr, [0, 6], [0, 1], clamp);
  return <div style={{position: "absolute", left: W * x, top: H * y, width: W * w * p, height: H * h, background: "#141210", zIndex: 13}} />;
};

/* ------------------------------------------------------------------ cartao final */
export const EndTitle: React.FC<{at?: number}> = ({at = 0}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  if (fr < 0) return null;
  const o = interpolate(fr, [0, 15], [0, 1], clamp);
  return (
    <div style={{position: "absolute", left: 0, right: 0, top: H * 0.5, transform: "translateY(-50%)", textAlign: "center", opacity: o, zIndex: 22}}>
      <div style={{fontFamily: MONT, fontWeight: 900, fontSize: H * 0.022, letterSpacing: H * 0.012, color: RED}}>SEU DOCUMENTÁRIO</div>
      <div style={{fontFamily: PLAY, fontStyle: "italic", fontWeight: 900, fontSize: H * 0.072, lineHeight: 1.02, color: "#f4e8cf", marginTop: H * 0.02, padding: `0 ${W * 0.08}px`}}>
        “A frase que fecha o filme.”
      </div>
      <div style={{fontFamily: TYPE, fontSize: H * 0.024, color: "#cdbfa5", marginTop: H * 0.022}}>— o subtítulo do encerramento</div>
    </div>
  );
};
