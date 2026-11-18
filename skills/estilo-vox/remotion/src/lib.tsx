/*
 * Biblioteca de movimentos — funciona em VERTICAL (1080x1920) e HORIZONTAL (1920x1080).
 * Posições vêm de useDims(): use fração da altura (ex.: y={H*0.45}) nas cenas para o mesmo código servir nos dois formatos.
 * Cor de destaque: defina TEMA.cor no topo do Video.tsx (ex.: vermelho Coca, azul Pepsi, amarelo Shell…).
 */
import React from "react";
import {
  AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from "remotion";
import {loadFont as loadMont} from "@remotion/google-fonts/Montserrat";
import {loadFont as loadPlay} from "@remotion/google-fonts/PlayfairDisplay";
import {loadFont as loadCaveat} from "@remotion/google-fonts/Caveat";
import {loadFont as loadElite} from "@remotion/google-fonts/SpecialElite";
import {geoNaturalEarth1, geoPath} from "d3-geo";
import {feature} from "topojson-client";
import mundo110 from "world-atlas/countries-110m.json";

export const MONT = loadMont("normal", {weights: ["600", "800", "900"], subsets: ["latin", "latin-ext"]}).fontFamily;
export const PLAY = loadPlay("italic", {weights: ["700", "900"], subsets: ["latin", "latin-ext"]}).fontFamily;
export const PLAYN = loadPlay("normal", {weights: ["700", "900"], subsets: ["latin", "latin-ext"]}).fontFamily;
export const HAND = loadCaveat("normal", {weights: ["700"], subsets: ["latin", "latin-ext"]}).fontFamily;
export const TYPE = loadElite("normal", {weights: ["400"], subsets: ["latin", "latin-ext"]}).fontFamily;

export const FPS = 30;
export const TEMA = {cor: "#E61D2B", escuro: "#7d0a12", claro: "#ff6b74"};
export const RED = TEMA.cor; // compatibilidade com o exemplo da Coca-Cola
export const f = (s: number) => Math.round(s * FPS);
export const src = (p: string) => staticFile(p);

/** Dimensões do vídeo atual. V = vertical. */
export const useDims = () => {
  const {width: W, height: H} = useVideoConfig();
  return {W, H, V: H > W};
};

/** Cena entre dois tempos absolutos (segundos) */
export const Seq: React.FC<{a: number; b: number; children: React.ReactNode; name?: string}> = ({a, b, children, name}) => (
  <Sequence from={f(a)} durationInFrames={Math.max(1, f(b) - f(a))} name={name} layout="none">{children}</Sequence>
);

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
export const useProg = () => {
  const fr = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return {fr, dur: durationInFrames, p: Math.min(1, fr / Math.max(1, durationInFrames - 1))};
};
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
type Tone = "sepia" | "bw" | "none" | "red";
const toneFilter = (t: Tone) => t === "sepia" ? "sepia(0.75) contrast(1.08) brightness(0.95)" : t === "bw" ? "grayscale(1) contrast(1.15)" : t === "red" ? "grayscale(1) contrast(1.2) brightness(0.8)" : "contrast(1.04)";

/* ------------------------------------------------------------------ IMAGEM / VÍDEO */

/** Imagem sempre em movimento (Ken Burns). fit=contain coloca fundo desfocado da mesma imagem. gold = moldura de museu. */
export const KB: React.FC<{s: string; z?: [number, number]; x?: [number, number]; y?: [number, number]; rot?: [number, number];
  tone?: Tone; fit?: "cover" | "contain"; dark?: number; shake?: number; gold?: boolean; pos?: string}> = ({s, z = [1.04, 1.16], x = [0, 0], y = [0, 0], rot = [0, 0], tone = "none", fit = "cover", dark = 0, shake = 0, gold, pos = "50% 50%"}) => {
  const {fr, p} = useProg();
  const {W, H, V} = useDims();
  const e = ease(p);
  const sc = interpolate(e, [0, 1], z), tx = interpolate(e, [0, 1], x), ty = interpolate(e, [0, 1], y), r = interpolate(e, [0, 1], rot);
  const sx = shake ? (random(`x${fr}`) - 0.5) * shake : 0, sy = shake ? (random(`y${fr}`) - 0.5) * shake : 0;
  const filt = toneFilter(tone);
  const main = <Img src={src(s)} style={{width: "100%", height: "100%", objectFit: fit, objectPosition: pos, filter: filt,
    transform: `translate(${tx + sx}px, ${ty + sy}px) scale(${sc}) rotate(${r}deg)`}} />;
  const gw = V ? W * 0.7 : H * 0.62, gh = gw * 1.34;
  return (
    <AbsoluteFill style={{backgroundColor: "#0b0b0b", overflow: "hidden"}}>
      {(fit === "contain" || gold) && <Img src={src(s)} style={{position: "absolute", width: "100%", height: "100%", objectFit: "cover",
        filter: `blur(40px) brightness(0.45) ${tone === "bw" || tone === "red" ? "grayscale(1)" : tone === "sepia" ? "sepia(0.8)" : ""}`, transform: `scale(${1.25 + p * 0.1})`}} />}
      {gold ? (
        <AbsoluteFill style={{justifyContent: "center", alignItems: "center"}}>
          <div style={{width: gw, height: gh, padding: 34, background: "linear-gradient(135deg,#7a5a17,#e8c766 30%,#8a6a1f 55%,#f3d97f 75%,#6e5014)",
            boxShadow: "0 40px 120px rgba(0,0,0,.8), inset 0 0 20px rgba(0,0,0,.6)", transform: `scale(${sc})`}}>
            <Img src={src(s)} style={{width: "100%", height: "100%", objectFit: "cover", filter: filt}} />
          </div>
        </AbsoluteFill>
      ) : fit === "contain" ? <AbsoluteFill style={{padding: 70}}>{main}</AbsoluteFill> : main}
      {tone === "red" && <AbsoluteFill style={{backgroundColor: TEMA.cor, mixBlendMode: "multiply", opacity: 0.85}} />}
      {dark > 0 && <AbsoluteFill style={{backgroundColor: "black", opacity: dark}} />}
    </AbsoluteFill>
  );
};

/** Filmagem de arquivo (mp4) com movimento de câmera, tom e sem som por padrão. 'de' = segundo do arquivo onde começa. */
export const Clip: React.FC<{s: string; de?: number; z?: [number, number]; x?: [number, number]; tone?: Tone; dark?: number; vol?: number; rate?: number}> = ({s, de = 0, z = [1.05, 1.15], x = [0, 0], tone = "none", dark = 0, vol = 0, rate = 1}) => {
  const {p} = useProg();
  const e = ease(p);
  return (
    <AbsoluteFill style={{backgroundColor: "black", overflow: "hidden"}}>
      <OffthreadVideo src={src(s)} startFrom={f(de)} volume={vol} playbackRate={rate} style={{width: "100%", height: "100%", objectFit: "cover", filter: toneFilter(tone),
        transform: `translateX(${interpolate(e, [0, 1], x)}px) scale(${interpolate(e, [0, 1], z)})`}} />
      {tone === "red" && <AbsoluteFill style={{backgroundColor: TEMA.cor, mixBlendMode: "multiply", opacity: 0.85}} />}
      {dark > 0 && <AbsoluteFill style={{backgroundColor: "black", opacity: dark}} />}
    </AbsoluteFill>
  );
};

/** Recorte 2.5D: pessoa/objeto recortado (PNG do recortar.py) na frente, fundo desfocado andando mais devagar. */
export const Parallax: React.FC<{fg: string; bg: string; dir?: 1 | -1; fgH?: number; tone?: Tone; bgDark?: number; lado?: "centro" | "esq" | "dir"}> = ({fg, bg, dir = 1, fgH = 0.78, tone = "sepia", bgDark = 0.35, lado = "centro"}) => {
  const {fr, p} = useProg();
  const {fps} = useVideoConfig();
  const {W, H} = useDims();
  const e = ease(p);
  const ent = spring({frame: fr, fps, config: {damping: 16}});
  const h = H * fgH;
  const left = lado === "esq" ? W * 0.05 : lado === "dir" ? undefined : undefined;
  return (
    <AbsoluteFill style={{overflow: "hidden", background: "#0b0b0b"}}>
      <Img src={src(bg)} style={{position: "absolute", width: "120%", height: "120%", left: "-10%", top: "-10%", objectFit: "cover",
        filter: `${toneFilter(tone)} blur(6px) brightness(${1 - bgDark})`, transform: `translateX(${dir * interpolate(e, [0, 1], [-30, 30])}px) scale(${1.05 + e * 0.05})`}} />
      <div style={{position: "absolute", bottom: 0, height: h, left: lado === "centro" ? 0 : left, right: lado === "dir" ? W * 0.05 : lado === "centro" ? 0 : undefined,
        display: "flex", justifyContent: "center", transform: `translateX(${dir * interpolate(e, [0, 1], [-90, 90])}px) translateY(${(1 - ent) * 80}px) scale(${1 + e * 0.12})`, transformOrigin: "50% 100%"}}>
        <Img src={src(fg)} style={{height: "100%", width: "auto", filter: `${toneFilter(tone)} drop-shadow(0 30px 60px rgba(0,0,0,.85))`, opacity: ent}} />
      </div>
    </AbsoluteFill>
  );
};

/** TV antiga / projetor: põe uma imagem ou clipe dentro de um aparelho com linhas de varredura. */
export const TVAntiga: React.FC<{s: string; video?: boolean; de?: number; tone?: Tone}> = ({s, video, de = 0, tone = "bw"}) => {
  const {fr, p} = useProg();
  const {W, H, V} = useDims();
  const tw = V ? W * 0.86 : H * 0.95, th = tw * 0.75;
  const flick = 0.92 + random(`fl${fr}`) * 0.08;
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 45%, #2b2622, #080706 75%)", justifyContent: "center", alignItems: "center"}}>
      <div style={{width: tw + 80, height: th + 80, borderRadius: 40, padding: 40, background: "linear-gradient(145deg,#3a2e24,#16110d)", boxShadow: "0 50px 120px rgba(0,0,0,.9)", transform: `scale(${1.02 + p * 0.06})`}}>
        <div style={{position: "relative", width: tw, height: th, borderRadius: "28px / 40px", overflow: "hidden", background: "black", opacity: flick}}>
          {video ? <OffthreadVideo src={src(s)} startFrom={f(de)} volume={0} style={{width: "100%", height: "100%", objectFit: "cover", filter: toneFilter(tone)}} />
            : <Img src={src(s)} style={{width: "100%", height: "100%", objectFit: "cover", filter: toneFilter(tone), transform: `scale(${1.05 + p * 0.08})`}} />}
          <AbsoluteFill style={{background: "repeating-linear-gradient(0deg, rgba(0,0,0,.25) 0 2px, transparent 2px 5px)"}} />
          <AbsoluteFill style={{background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.75))"}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Jornal/documento REAL com marca-texto. marcas = retângulos em % da imagem [x, y, largura, altura] (0–100). */
export const Jornal: React.FC<{s: string; marcas?: [number, number, number, number][]; at?: number; step?: number; cor?: string}> = ({s, marcas = [], at = 0.4, step = 0.5, cor = "#ffe14d"}) => {
  const {fr, p} = useProg();
  const {W, H, V} = useDims();
  return (
    <AbsoluteFill style={{background: "#141210", justifyContent: "center", alignItems: "center", overflow: "hidden"}}>
      <div style={{position: "relative", display: "inline-block", transform: `perspective(1600px) rotateX(${8 - p * 5}deg) rotateZ(${-2.5 + p * 2}deg) scale(${1 + p * 0.12})`, boxShadow: "0 40px 100px rgba(0,0,0,.8)"}}>
        {/* o documento cabe sempre inteiro na tela; as marcas são % da própria imagem */}
        <Img src={src(s)} style={{display: "block", maxWidth: W * (V ? 0.9 : 0.62), maxHeight: H * 0.8, filter: "sepia(.25) contrast(1.05)"}} />
        {marcas.map(([x, y, mw, mh], k) => {
          const g = interpolate(fr, [f(at + k * step), f(at + k * step) + 10], [0, 1], clamp);
          return <div key={k} style={{position: "absolute", left: `${x}%`, top: `${y}%`, width: `${mw * g}%`, height: `${mh}%`, background: cor, mixBlendMode: "multiply", opacity: 0.85}} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ TEXTO */

/** Palavra gigante que entra com soco (escala + desfoque) */
export const Punch: React.FC<{t: string; color?: string; size?: number; y?: number; at?: number; strike?: boolean; glitch?: boolean;
  font?: string; italic?: boolean; stroke?: boolean; bg?: string; sub?: string}> = ({t, color = "white", size = 150, y, at = 0, strike, glitch, font, italic, stroke, bg, sub}) => {
  const fr = useCurrentFrame() - f(at);
  const {fps} = useVideoConfig();
  const {W, H} = useDims();
  if (fr < 0) return null;
  const sp = spring({frame: fr, fps, config: {damping: 14, stiffness: 180, mass: 0.6}});
  const sc = interpolate(sp, [0, 1], [1.7, 1]) + fr * 0.0015;
  const bl = interpolate(fr, [0, 6], [18, 0], {extrapolateRight: "clamp"});
  const op = interpolate(fr, [0, 4], [0, 1], {extrapolateRight: "clamp"});
  const gx = glitch && fr % 7 < 2 ? (random(`g${fr}`) - 0.5) * 40 : 0;
  const st = interpolate(fr, [6, 14], [0, 100], clamp);
  return (
    <div style={{position: "absolute", left: 0, right: 0, top: y ?? H * 0.45, display: "flex", flexDirection: "column", alignItems: "center",
      transform: `translateY(-50%) scale(${sc}) translateX(${gx}px)`, opacity: op, filter: `blur(${bl}px)`}}>
      <div style={{position: "relative", padding: bg ? "6px 34px" : 0, background: bg, fontFamily: font ?? MONT, fontWeight: 900, fontStyle: italic ? "italic" : "normal",
        fontSize: size, lineHeight: 0.95, color: stroke ? "transparent" : color, WebkitTextStroke: stroke ? `4px ${color}` : undefined, textAlign: "center", letterSpacing: -2,
        maxWidth: W * 0.93, textShadow: glitch ? "-6px 0 rgba(0,255,255,.6), 6px 0 rgba(255,0,60,.7)" : bg ? "none" : "0 8px 40px rgba(0,0,0,.65)"}}>
        {t}
        {strike && <div style={{position: "absolute", left: -10, top: "52%", height: 16, width: `${st}%`, background: TEMA.cor, boxShadow: `0 0 20px ${TEMA.cor}`}} />}
      </div>
      {sub && <div style={{marginTop: 24, fontFamily: MONT, fontWeight: 600, fontSize: 44, color: "white", letterSpacing: 6, textTransform: "uppercase", opacity: 0.9}}>{sub}</div>}
    </div>
  );
};

/** Frase pequena palavra por palavra saindo do desfoque. Palavra com * na frente fica em destaque. */
export const Small: React.FC<{t: string; y?: number; at?: number; color?: string; size?: number; font?: string; step?: number}> = ({t, y, at = 0, color = "white", size = 52, font, step = 0.12}) => {
  const fr = useCurrentFrame() - f(at);
  const {H} = useDims();
  return (
    <div style={{position: "absolute", top: y ?? H * 0.31, left: 60, right: 60, textAlign: "center", fontFamily: font ?? MONT, fontWeight: 600, fontSize: size, color, lineHeight: 1.2,
      textShadow: "0 4px 20px rgba(0,0,0,.8)"}}>
      {t.split(" ").map((w, i) => {
        const k = fr - f(i * step);
        const bold = w.startsWith("*");
        return <span key={i} style={{display: "inline-block", marginRight: 14, opacity: interpolate(k, [0, 5], [0, 1], clamp), filter: `blur(${interpolate(k, [0, 6], [12, 0], clamp)}px)`,
          transform: `translateY(${interpolate(k, [0, 6], [14, 0], clamp)}px)`, fontWeight: bold ? 900 : 600, color: bold ? TEMA.cor : color}}>{bold ? w.slice(1) : w}</span>;
      })}
    </div>
  );
};

/** Contador / odômetro com desfoque de velocidade (não aparece antes de 'at') */
export const Counter: React.FC<{from: number; to: number; at?: number; dur?: number; y?: number; size?: number; prefix?: string; suffix?: string;
  color?: string; sep?: boolean; sub?: string; font?: string}> = ({from, to, at = 0, dur = 1, y, size = 260, prefix = "", suffix = "", color = "white", sep = true, sub, font}) => {
  const fr = useCurrentFrame() - f(at);
  const {H} = useDims();
  if (fr < 0) return null;
  const t = interpolate(fr, [0, f(dur)], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const v = Math.round(from + (to - from) * t);
  const speed = t < 1 ? 1 - t : 0;
  return (
    <div style={{position: "absolute", top: y ?? H * 0.47, left: 0, right: 0, textAlign: "center", transform: "translateY(-50%)"}}>
      <div style={{fontFamily: font ?? PLAYN, fontWeight: 900, fontSize: size, color, lineHeight: 1, filter: `blur(${speed * 6}px)`,
        transform: `translateY(${Math.sin(fr * 2.1) * speed * 18}px) scale(${1 + (1 - speed) * 0.04})`, textShadow: "0 10px 50px rgba(0,0,0,.7)"}}>
        {prefix}{sep ? v.toLocaleString("pt-BR") : String(v)}{suffix}
      </div>
      {sub && <div style={{fontFamily: MONT, fontWeight: 800, fontSize: 56, color: "white", letterSpacing: 8, marginTop: 10}}>{sub}</div>}
    </div>
  );
};

/** Rótulo escrito à mão com seta */
export const Label: React.FC<{t: string; x: number; y: number; at?: number; flip?: boolean}> = ({t, x, y, at = 0, flip}) => {
  const fr = useCurrentFrame() - f(at);
  if (fr < 0) return null;
  const d = interpolate(fr, [0, 10], [300, 0], {extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", left: x, top: y, opacity: interpolate(fr, [0, 5], [0, 1], {extrapolateRight: "clamp"})}}>
      <div style={{fontFamily: HAND, fontWeight: 700, fontSize: 92, color: "white", transform: "rotate(-6deg)", textShadow: "0 4px 18px rgba(0,0,0,.9)", whiteSpace: "nowrap"}}>{t}</div>
      <svg width={260} height={160} style={{position: "absolute", top: 80, left: flip ? -160 : 120, transform: flip ? "scaleX(-1)" : undefined}}>
        <path d="M10 10 C 80 40, 160 60, 230 140 M230 140 L200 128 M230 140 L224 108" stroke="white" strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray={300} strokeDashoffset={d} />
      </svg>
    </div>
  );
};

/** Carimbo que cai */
export const Stamp: React.FC<{t: string; at?: number; y?: number}> = ({t, at = 0, y}) => {
  const fr = useCurrentFrame() - f(at);
  const {H} = useDims();
  if (fr < 0) return null;
  const sc = interpolate(fr, [0, 5], [2.6, 1], {extrapolateRight: "clamp", easing: Easing.in(Easing.quad)});
  return (
    <div style={{position: "absolute", top: y ?? H * 0.46, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(-50%) rotate(-12deg) scale(${sc})`,
      opacity: interpolate(fr, [0, 3], [0, 1], {extrapolateRight: "clamp"})}}>
      <div style={{border: `14px solid ${TEMA.cor}`, borderRadius: 18, padding: "10px 40px", fontFamily: MONT, fontWeight: 900, fontSize: 150, color: TEMA.cor, letterSpacing: 6, background: "rgba(255,255,255,.06)"}}>{t}</div>
    </div>
  );
};

/** Chips de interface surgindo */
export const Chips: React.FC<{items: string[]; at?: number; y?: number; step?: number}> = ({items, at = 0, y, step = 0.25}) => {
  const fr = useCurrentFrame() - f(at);
  const {fps} = useVideoConfig();
  const {H} = useDims();
  return (
    <div style={{position: "absolute", top: y ?? H * 0.4, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26}}>
      {items.map((it, i) => {
        const sp = spring({frame: fr - f(i * step), fps, config: {damping: 12}});
        return <div key={i} style={{transform: `scale(${sp}) translateX(${(i % 2 ? 1 : -1) * 40 * (1 - sp)}px)`, opacity: sp, padding: "18px 48px", borderRadius: 18,
          background: i % 2 ? "rgba(255,255,255,.95)" : TEMA.cor, color: i % 2 ? TEMA.cor : "white", fontFamily: MONT, fontWeight: 900, fontSize: 70, letterSpacing: 2, boxShadow: "0 16px 50px rgba(0,0,0,.5)"}}>{it}</div>;
      })}
    </div>
  );
};

/** Texto sendo digitado (máquina de escrever no papel, ou editor com seleção azul e apagar) */
export const Typed: React.FC<{t: string; at?: number; cps?: number; y?: number; size?: number; paper?: boolean; editor?: boolean; selectAt?: number; deleteAt?: number}> = ({t, at = 0, cps = 22, y, size = 76, paper, editor, selectAt, deleteAt}) => {
  const fr = useCurrentFrame() - f(at);
  const {W, H} = useDims();
  const n = Math.max(0, Math.min(t.length, Math.floor((fr / FPS) * cps)));
  const sel = selectAt !== undefined && fr >= f(selectAt - at);
  const del = deleteAt !== undefined && fr >= f(deleteAt - at);
  return (
    <div style={{position: "absolute", top: y ?? H * 0.3, left: W * 0.075, right: W * 0.075, fontFamily: editor ? MONT : TYPE, fontWeight: editor ? 800 : 400, fontSize: size,
      color: paper ? "#1d1a16" : "white", lineHeight: 1.25, textAlign: editor ? "center" : "left"}}>
      <span style={{background: sel && !del ? "#2f7cf6" : "transparent", color: sel && !del ? "white" : undefined}}>{del ? "" : t.slice(0, n)}</span>
      <span style={{opacity: Math.floor(fr / 8) % 2 === 0 ? 1 : 0, color: editor ? "#2f7cf6" : "#1d1a16"}}>|</span>
    </div>
  );
};

/* ------------------------------------------------------------------ GRÁFICOS */

/** Mapa-múndi animado: países (nome em inglês do Natural Earth, ex. "Brazil", "Germany") acendem em sequência. */
const PAISES = (feature(mundo110 as any, (mundo110 as any).objects.countries) as any).features as any[];
export const Mapa: React.FC<{destaque?: string[]; at?: number; step?: number; pontos?: [number, number][]; zoom?: [number, number]; centro?: [number, number]; titulo?: string}> = ({destaque = [], at = 0.2, step = 0.12, pontos = [], zoom = [1, 1.15], centro, titulo}) => {
  const {fr, p} = useProg();
  const {W, H} = useDims();
  const proj = geoNaturalEarth1().fitExtent([[W * 0.03, H * 0.2], [W * 0.97, H * 0.8]], {type: "Sphere"} as any);
  if (centro) proj.rotate([-centro[0], 0]);
  const path = geoPath(proj);
  const z = interpolate(ease(p), [0, 1], zoom);
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 50%, #1a1a1a, #050505)"}}>
      <svg width={W} height={H} style={{transform: `scale(${z})`}}>
        {PAISES.map((c, i) => {
          const k = destaque.indexOf(c.properties.name);
          const g = k < 0 ? 0 : interpolate(fr, [f(at + k * step), f(at + k * step) + 8], [0, 1], clamp);
          return <path key={i} d={path(c) || ""} fill={k < 0 ? "#2a2a2a" : TEMA.cor} fillOpacity={k < 0 ? 1 : 0.25 + 0.75 * g} stroke="#555" strokeWidth={0.6}
            style={{filter: g > 0 ? `drop-shadow(0 0 ${12 * g}px ${TEMA.cor})` : undefined}} />;
        })}
        {pontos.map(([lon, lat], k) => {
          const xy = proj([lon, lat]); if (!xy) return null;
          const g = interpolate(fr, [f(at + k * 0.1), f(at + k * 0.1) + 10], [0, 1], clamp);
          return <g key={k}><circle cx={xy[0]} cy={xy[1]} r={6 + 30 * ((fr / 20 + k) % 1)} fill="none" stroke={TEMA.cor} opacity={g * (1 - ((fr / 20 + k) % 1))} strokeWidth={3} /><circle cx={xy[0]} cy={xy[1]} r={7 * g} fill="white" /></g>;
        })}
      </svg>
      {titulo && <Punch t={titulo} size={90} y={H * 0.12} />}
    </AbsoluteFill>
  );
};

/** Linha do tempo: anos ao longo de uma linha que se desenha; a câmera acompanha. */
export const Linha: React.FC<{itens: {ano: string; t: string}[]; at?: number; step?: number}> = ({itens, at = 0.2, step = 0.6}) => {
  const fr = useCurrentFrame();
  const {W, H} = useDims();
  const gap = W * 0.42;
  const idx = interpolate(fr, [f(at), f(at + step * (itens.length - 1))], [0, itens.length - 1], clamp);
  const camX = W / 2 - (W * 0.25 + idx * gap);
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 50%, #1c1712, #070605)", overflow: "hidden"}}>
      <div style={{position: "absolute", top: H * 0.5, left: 0, transform: `translateX(${camX}px)`}}>
        <div style={{position: "absolute", top: -3, left: 0, height: 6, width: W * 0.25 + idx * gap + 40, background: "white", opacity: 0.85}} />
        {itens.map((it, k) => {
          const g = interpolate(fr, [f(at + k * step), f(at + k * step) + 8], [0, 1], clamp);
          return (
            <div key={k} style={{position: "absolute", left: W * 0.25 + k * gap, top: 0, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * g})`, opacity: 0.25 + 0.75 * g, textAlign: "center", width: gap * 0.9}}>
              <div style={{width: 34, height: 34, borderRadius: 17, background: TEMA.cor, margin: "0 auto", boxShadow: `0 0 30px ${TEMA.cor}`}} />
              <div style={{fontFamily: PLAYN, fontWeight: 900, fontSize: 120, color: "white", marginTop: 20}}>{it.ano}</div>
              <div style={{fontFamily: MONT, fontWeight: 700, fontSize: 44, color: "white", opacity: 0.85}}>{it.t}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Gráfico de barras crescendo (receita, valor de mercado, vendas…) */
export const Barras: React.FC<{dados: {rotulo: string; valor: number; destaque?: boolean}[]; unidade?: string; at?: number; titulo?: string}> = ({dados, unidade = "", at = 0.2, titulo}) => {
  const fr = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, H} = useDims();
  const max = Math.max(...dados.map((d) => d.valor));
  const bw = (W * 0.84) / dados.length;
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 60%, #1c1c1c, #050505)"}}>
      {titulo && <div style={{position: "absolute", top: H * 0.14, left: 0, right: 0, textAlign: "center", fontFamily: MONT, fontWeight: 900, fontSize: 72, color: "white"}}>{titulo}</div>}
      {dados.map((d, k) => {
        const g = spring({frame: fr - f(at + k * 0.15), fps, config: {damping: 18}});
        const h = (H * 0.5 * d.valor) / max * g;
        return (
          <div key={k} style={{position: "absolute", left: W * 0.08 + k * bw + bw * 0.12, width: bw * 0.76, bottom: H * 0.2, height: h, background: d.destaque ? TEMA.cor : "#5a5a5a",
            boxShadow: d.destaque ? `0 0 40px ${TEMA.cor}` : undefined, borderRadius: "10px 10px 0 0"}}>
            <div style={{position: "absolute", top: -70, width: "100%", textAlign: "center", fontFamily: MONT, fontWeight: 800, fontSize: 44, color: "white", opacity: g}}>{Math.round(d.valor * g).toLocaleString("pt-BR")}{unidade}</div>
            <div style={{position: "absolute", bottom: -64, width: "100%", textAlign: "center", fontFamily: MONT, fontWeight: 700, fontSize: 38, color: "white", opacity: 0.8}}>{d.rotulo}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Gráfico em traço que dispara para cima (rival em azul) */
export const Graph: React.FC<{up: number; rival?: string}> = ({up, rival = "RIVAL"}) => {
  const fr = useCurrentFrame();
  const {W, H} = useDims();
  const flat = interpolate(fr, [0, f(0.6)], [0, 1], {extrapolateRight: "clamp"});
  const rise = interpolate(fr, [f(up), f(up) + 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const x0 = W * 0.07, x1 = W * 0.55, x2 = W * 0.93, yb = H * 0.65, yt = H * 0.18;
  const pts = `${x0},${yb} ${x0 + (x1 - x0) * flat},${yb - H * 0.02 * flat} ${x1 + (x2 - x1) * rise},${yb - H * 0.02 - (yb - yt) * rise}`;
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 60%, #1c1c1c, #050505)"}}>
      <svg width={W} height={H}>
        {[0.25, 0.4, 0.55, 0.7].map((yy) => <line key={yy} x1={x0} x2={x2} y1={H * yy} y2={H * yy} stroke="white" opacity={0.08} strokeWidth={2} />)}
        <polyline points={`${x0},${yb - H * 0.04} ${x1},${yb - H * 0.06} ${x2},${yb - H * 0.1}`} stroke="#3d7cff" strokeWidth={10} fill="none" opacity={0.6} />
        <text x={x2} y={yb - H * 0.12} fill="#3d7cff" fontFamily={MONT} fontWeight={800} fontSize={44} textAnchor="end" opacity={0.7}>{rival}</text>
        <polyline points={pts} stroke={TEMA.cor} strokeWidth={16} fill="none" strokeLinejoin="round" style={{filter: `drop-shadow(0 0 18px ${TEMA.cor})`}} />
      </svg>
    </AbsoluteFill>
  );
};

/** Desenho em traço (path num espaço de 1080x1920, centralizado no vídeo). Padrão: garrafa curvilínea. */
const GARRAFA = "M470 300 L470 420 C470 470 440 520 430 600 C420 680 400 720 400 800 C400 880 430 920 430 1000 C430 1080 390 1130 390 1250 C390 1400 420 1500 440 1560 L640 1560 C660 1500 690 1400 690 1250 C690 1130 650 1080 650 1000 C650 920 680 880 680 800 C680 720 660 680 650 600 C640 520 610 470 610 420 L610 300 Z";
export const Traco: React.FC<{d?: string; glow?: boolean; len?: number}> = ({d = GARRAFA, glow, len = 3000}) => {
  const fr = useCurrentFrame();
  const {W, H} = useDims();
  const off = interpolate(fr, [0, 40], [len, 0], {extrapolateRight: "clamp"});
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid meet" style={{position: "absolute", left: 0, top: 0}}>
      <path d={d} fill="none" stroke="white" strokeWidth={10} strokeDasharray={len} strokeDashoffset={off}
        style={{filter: glow ? `drop-shadow(0 0 30px rgba(255,255,255,.9)) drop-shadow(0 0 60px ${TEMA.cor})` : undefined}} />
    </svg>
  );
};
export const BottleLine = Traco; // nome antigo

/* ------------------------------------------------------------------ MOLDURA, VINHETA, TRANSIÇÕES */

/** Moldura da série: faixa escura no meio e elementos girando em cima e embaixo (padrão: tampinhas). Troque 'item' pelo símbolo do tema. */
const Cap: React.FC<{r: number; rot: number}> = ({r, rot}) => {
  const pts = Array.from({length: 42}, (_, i) => { const a = (i / 42) * Math.PI * 2, rr = i % 2 ? r : r * 0.9; return `${Math.cos(a) * rr},${Math.sin(a) * rr}`; }).join(" ");
  return (
    <svg width={r * 2.2} height={r * 2.2} viewBox={`${-r * 1.1} ${-r * 1.1} ${r * 2.2} ${r * 2.2}`} style={{transform: `rotate(${rot}deg)`}}>
      <polygon points={pts} fill={TEMA.escuro} /><circle r={r * 0.78} fill={TEMA.cor} />
      <circle r={r * 0.78} fill="none" stroke={TEMA.claro} strokeWidth={3} opacity={0.6} /><ellipse cx={-r * 0.25} cy={-r * 0.3} rx={r * 0.35} ry={r * 0.18} fill="white" opacity={0.25} />
    </svg>
  );
};
export const Moldura: React.FC<{band?: number; item?: (r: number, rot: number) => React.ReactNode}> = ({band, item}) => {
  const fr = useCurrentFrame();
  const {W, H, V} = useDims();
  const b = band ?? (V ? H * 0.5625 : H * 0.62);
  const zone = (H - b) / 2;
  const rows = zone > 300 ? 2 : 1;
  const r = Math.min(76, (zone / rows) * 0.42);
  const n = Math.ceil(W / (r * 2.3)) + 4;
  const row = (dir: number, top: number) => (
    <div style={{position: "absolute", top, left: -r * 3, display: "flex", gap: 6, transform: `translateX(${((fr * 3 * dir) % (r * 2.2 + 6)) - r}px)`}}>
      {Array.from({length: n}, (_, i) => <div key={i}>{item ? item(r, fr * 4 * dir + i * 20) : <Cap r={r} rot={fr * 4 * dir + i * 20} />}</div>)}
    </div>
  );
  const step = zone / rows;
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <div style={{position: "absolute", top: 0, left: 0, right: 0, height: zone, background: `linear-gradient(${TEMA.escuro}, ${TEMA.cor})`, overflow: "hidden"}}>
        {Array.from({length: rows}, (_, k) => row(k % 2 ? -1 : 1, zone - step * (rows - k) + (step - r * 2.2) / 2))}
      </div>
      <div style={{position: "absolute", bottom: 0, left: 0, right: 0, height: zone, background: `linear-gradient(${TEMA.cor}, ${TEMA.escuro})`, overflow: "hidden"}}>
        {Array.from({length: rows}, (_, k) => row(k % 2 ? 1 : -1, step * k + (step - r * 2.2) / 2))}
      </div>
      <div style={{position: "absolute", top: zone - 6, left: 0, right: 0, height: 6, background: "white", opacity: 0.85}} />
      <div style={{position: "absolute", bottom: zone - 6, left: 0, right: 0, height: 6, background: "white", opacity: 0.85}} />
    </AbsoluteFill>
  );
};

/** Ilustração de cartum (fundo branco) virando traço branco sobre preto. count>1 multiplica. */
export const Toon: React.FC<{s: string; x?: [number, number]; y?: number; size?: number; shake?: number; count?: number}> = ({s, x = [0, 0], y, size = 620, shake = 0, count = 1}) => {
  const {fr, p} = useProg();
  const {fps} = useVideoConfig();
  const {W, H} = useDims();
  const sp = spring({frame: fr, fps, config: {damping: 12, stiffness: 160}});
  const tx = interpolate(sp, [0, 1], [x[0], x[1]]);
  const sx = shake ? (random(`t${fr}`) - 0.5) * shake : 0;
  const cy = y ?? H * 0.47;
  return (
    <AbsoluteFill>
      {Array.from({length: count}, (_, i) => {
        const ap = spring({frame: Math.max(0, fr - i * 3), fps, config: {damping: 14}});
        const off = count > 1 ? (i - (count - 1) / 2) * (size * 0.62) : 0;
        return <Img key={i} src={src(s)} style={{position: "absolute", width: size, height: size, left: W / 2 - size / 2 + tx + sx + off * ap, top: cy - size / 2,
          filter: "invert(1) contrast(1.4)", mixBlendMode: "screen", transform: `scale(${(0.6 + 0.4 * ap) * (1 + p * 0.08)})`, opacity: ap}} />;
      })}
    </AbsoluteFill>
  );
};

/** Retrato em círculo com o nome em serifada cruzando */
export const Portrait: React.FC<{s: string; name: string; tone?: Tone; pos?: string}> = ({s, name, tone = "sepia", pos = "50% 20%"}) => {
  const {fr, p} = useProg();
  const {fps} = useVideoConfig();
  const {W, H, V} = useDims();
  const sp = spring({frame: fr, fps, config: {damping: 13}});
  const ns = spring({frame: fr - 5, fps, config: {damping: 15}});
  const flash = interpolate(fr, [0, 4, 14], [0, 0.9, 0], {extrapolateRight: "clamp"});
  const size = V ? 660 : H * 0.56, top = V ? H * 0.17 : H * 0.08;
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 40%, #2a2420, #0b0b0b 70%)"}}>
      <div style={{position: "absolute", left: W / 2 - size / 2, top, width: size, height: size, borderRadius: "50%", overflow: "hidden",
        transform: `scale(${0.7 + 0.3 * sp + p * 0.05})`, boxShadow: "0 0 0 10px rgba(255,255,255,.08), 0 30px 90px rgba(0,0,0,.8)"}}>
        <Img src={src(s)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, filter: toneFilter(tone), transform: `scale(${1.05 + p * 0.1})`}} />
      </div>
      <div style={{position: "absolute", top: top + size - 60, left: 0, right: 0, textAlign: "center", fontFamily: PLAY, fontWeight: 900,
        fontSize: Math.min(V ? 130 : 150, Math.floor((W * 1.76) / name.length)), color: "white", lineHeight: 0.9, opacity: ns, transform: `translateX(${(1 - ns) * 160}px)`,
        textShadow: "0 10px 40px rgba(0,0,0,.8)"}}>{name}</div>
      <AbsoluteFill style={{background: "radial-gradient(circle at 70% 30%, #ffb36b, #ff3d6e 40%, transparent 70%)", opacity: flash, mixBlendMode: "screen"}} />
    </AbsoluteFill>
  );
};

/** Vinheta de capítulo (1 s): onda varre a cor do tema, "Capítulo N", objeto sobe e corta o texto, subtítulo. */
export const Chapter: React.FC<{n: number; t: string; glitch?: boolean}> = ({n, t, glitch}) => {
  const {fr} = useProg();
  const {fps} = useVideoConfig();
  const {W, H} = useDims();
  const wave = interpolate(fr, [0, 10], [2400, 0], {extrapolateRight: "clamp"});
  const sp = spring({frame: fr - 3, fps, config: {damping: 12, stiffness: 200}});
  const obj = interpolate(fr, [8, 22], [H * 0.7, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const sub = interpolate(fr, [12, 18], [0, 1], clamp);
  const gx = glitch && fr % 5 < 2 ? (random(`c${fr}`) - 0.5) * 50 : 0;
  return (
    <AbsoluteFill style={{background: glitch ? "#14060a" : TEMA.cor}}>
      <svg width={W} height={H} viewBox="0 0 1080 1920" preserveAspectRatio="none" style={{position: "absolute"}}>
        <path d="M-100 1100 C 200 900, 400 1300, 700 1050 S 1100 800, 1300 950" stroke="white" strokeWidth={70} fill="none" strokeDasharray={2400} strokeDashoffset={wave} opacity={glitch ? 0.25 : 0.95} />
      </svg>
      <div style={{position: "absolute", top: H * 0.43, left: 0, right: 0, textAlign: "center", transform: `translateX(${gx}px) scale(${0.8 + 0.2 * sp})`, opacity: sp,
        fontFamily: PLAYN, fontWeight: 900, fontSize: 150, color: "white", textShadow: glitch ? "-8px 0 #0ff, 8px 0 #f03" : "0 10px 40px rgba(0,0,0,.4)"}}>Capítulo {n}</div>
      <div style={{position: "absolute", left: W / 2 - 52, top: H * 0.33, width: 104, height: H * 0.27, transform: `translateY(${obj}px)`, borderRadius: "60px 60px 40px 40px",
        background: "linear-gradient(90deg,#1a0a06,#3b1a0e 40%,#2a120a)", boxShadow: "0 0 0 6px rgba(255,255,255,.15)"}} />
      <div style={{position: "absolute", top: H * 0.64, left: 0, right: 0, textAlign: "center", opacity: sub, fontFamily: MONT, fontWeight: 900, fontSize: 64,
        color: glitch ? TEMA.cor : "white", letterSpacing: 2, textTransform: "uppercase"}}>{t}</div>
    </AbsoluteFill>
  );
};

/** Clarão de luz (light leak) */
export const Flash: React.FC<{at?: number; color?: string}> = ({at = 0, color = "#ffb36b"}) => {
  const fr = useCurrentFrame() - f(at);
  if (fr < 0 || fr > 16) return null;
  return <AbsoluteFill style={{background: `radial-gradient(circle at 30% 30%, ${color}, #ff3d6e 45%, transparent 75%)`, opacity: interpolate(fr, [0, 4, 16], [0, 0.85, 0]), mixBlendMode: "screen"}} />;
};

/** Linhas de velocidade */
export const Speed: React.FC = () => {
  const fr = useCurrentFrame();
  const {W, H} = useDims();
  return (
    <AbsoluteFill style={{background: "black"}}>
      <svg width={W} height={H}>
        {Array.from({length: 70}, (_, i) => {
          const a = random(`a${i}`) * Math.PI * 2, r0 = 80 + ((fr * 40 + random(`r${i}`) * 900) % (Math.max(W, H) * 0.6)), len = 120 + random(`l${i}`) * 260;
          return <line key={i} x1={W / 2 + Math.cos(a) * r0} y1={H / 2 + Math.sin(a) * r0} x2={W / 2 + Math.cos(a) * (r0 + len)} y2={H / 2 + Math.sin(a) * (r0 + len)} stroke="white" strokeWidth={2 + random(`w${i}`) * 5} opacity={0.75} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Imagem que racha ao meio em 'at' */
export const Split: React.FC<{s: string; at: number}> = ({s, at}) => {
  const {fr, p} = useProg();
  const k = Math.max(0, fr - f(at));
  const gap = interpolate(k, [0, 8], [0, 140], {extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const rot = interpolate(k, [0, 12], [0, 9], {extrapolateRight: "clamp"});
  const sh = fr < f(at) ? (random(`s${fr}`) - 0.5) * 18 : 0;
  const half = (left: boolean) => (
    <AbsoluteFill style={{clipPath: left ? "polygon(0 0, 52% 0, 46% 35%, 54% 60%, 47% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 47% 100%, 54% 60%, 46% 35%)",
      transform: `translateX(${(left ? -1 : 1) * gap + sh}px) rotate(${(left ? -1 : 1) * rot}deg)`}}>
      <Img src={src(s)} style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.05 + p * 0.08})`}} />
    </AbsoluteFill>
  );
  return <AbsoluteFill style={{background: "black"}}>{half(true)}{half(false)}</AbsoluteFill>;
};

/** Mosaico que se multiplica */
export const Mosaic: React.FC<{imgs: string[]}> = ({imgs}) => {
  const {fr, p} = useProg();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: "#120606", display: "flex", flexWrap: "wrap", transform: `scale(${1.2 - p * 0.15}) rotate(-4deg)`}}>
      {Array.from({length: 16}, (_, i) => {
        const sp = spring({frame: fr - i * 1.2, fps, config: {damping: 14}});
        return <Img key={i} src={src(imgs[i % imgs.length])} style={{width: "25%", height: "25%", objectFit: "cover", transform: `scale(${sp})`, opacity: sp, border: "6px solid #120606", filter: "sepia(.3)"}} />;
      })}
    </AbsoluteFill>
  );
};

/** Grão de filme + vinheta escura nas bordas, por cima de tudo */
export const Grain: React.FC = () => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <Img src={src(`fx/grao${Math.floor(fr / 2) % 6}.png`)} style={{width: "100%", height: "100%", objectFit: "cover", opacity: 0.09, mixBlendMode: "overlay"}} />
      <AbsoluteFill style={{background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)"}} />
    </AbsoluteFill>
  );
};
