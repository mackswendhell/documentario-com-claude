import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {useDims, MONT, PLAY, HAND, TYPE} from "./lib";
import {
  PaperBG, DarkBG, Camera, Headline, Photo, DocShot, StampMark, Pin, Tape, Arrow, Scribble, CircleMark,
  Caption, ChapterCard, BigNumber, Filmstrip, EvidenceTape, FileLabel, Highlight, PaperWipe, EndTitle, RED, INK, INK2, PAPER,
} from "./vox";

const MapRoute: React.FC<{at?: number}> = ({at = 0}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  const p = interpolate(fr, [0, 34], [0, 1], clamp);
  const pts = [[0.245, 0.40], [0.795, 0.585], [0.815, 0.60], [0.845, 0.71]];
  const d = `M${W * pts[0][0]},${H * pts[0][1]} Q${W * 0.55},${H * 0.30} ${W * pts[1][0]},${H * pts[1][1]} L${W * pts[2][0]},${H * pts[2][1]} Q${W * 0.93},${H * 0.66} ${W * pts[3][0]},${H * pts[3][1]}`;
  return (
    <svg width={W} height={H} style={{position: "absolute", inset: 0, overflow: "visible"}}>
      <path d={d} fill="none" stroke="#f6e2c4" strokeWidth={4} strokeDasharray={14} pathLength={1} strokeDashoffset={1 - p} opacity={0.9} strokeLinecap="round" />
      <circle cx={W * pts[1][0]} cy={H * pts[1][1]} r={10} fill="none" stroke={RED} strokeWidth={3} opacity={p > 0.55 ? 0.9 : 0} />
    </svg>
  );
};

export type Scene = {
  start: number; end: number; kind: string; kicker: string; head: string; line?: string;
  stamp?: string; note?: string; a?: string; b?: string; c?: string; tone?: string; motion?: string; chapter?: number;
};

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const isImg = (s?: string) => !!s && s !== "none";

/* ------------------------------------------------------------------ linha do tempo */
const TimelineShot: React.FC<{items: {a: string; t: string}[]; at?: number}> = ({items, at = 0}) => {
  const fr = useCurrentFrame() - Math.round(at * 30);
  const {W, H} = useDims();
  return (
    <AbsoluteFill style={{justifyContent: "center", alignItems: "center", zIndex: 18}}>
      <div style={{width: W * 0.74, position: "relative", paddingTop: H * 0.06}}>
        <div style={{position: "absolute", left: 0, right: 0, top: H * 0.115, height: 4, background: "#8a765a"}} />
        <div style={{position: "absolute", left: 0, top: H * 0.115, height: 4, width: `${W * 0.74 * interpolate(fr, [0, 40], [0, 1], clamp)}`, background: RED}} />
        <div style={{display: "flex", justifyContent: "space-between"}}>
          {items.map((it, i) => {
            const k = interpolate(fr, [6 + i * 7, 14 + i * 7], [0, 1], clamp);
            return (
              <div key={i} style={{width: W * 0.16, opacity: k, transform: `translateY(${(1 - k) * 20}px)`}}>
                <div style={{position: "relative", height: H * 0.06}}>
                  <div style={{position: "absolute", left: "50%", top: H * 0.008, width: H * 0.026, height: H * 0.026, marginLeft: -H * 0.013, borderRadius: "50%",
                    background: i % 2 ? PAPER : RED, border: `3px solid ${RED}`, boxShadow: "0 2px 6px rgba(0,0,0,.3)"}} />
                </div>
                <div style={{fontFamily: PLAY, fontWeight: 900, fontSize: H * 0.05, color: RED, textAlign: "center"}}>{it.a}</div>
                <div style={{fontFamily: MONT, fontWeight: 800, fontSize: H * 0.019, lineHeight: 1.2, color: INK, textAlign: "center", textTransform: "uppercase", marginTop: H * 0.006}}>{it.t}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ plano genérico */
type Shot = {from: number; to: number; type: string; a?: string; b?: string; c?: string};

const kinds: Record<string, string[]> = {
  abertura: ["title", "photo", "detail", "photo"],
  capitulo: ["chapter", "photo", "title"],
  dossie: ["title", "photo", "detail", "photo2"],
  foto: ["photo", "detail", "title", "photo2"],
  documento: ["doc", "photo", "title", "photo2"],
  evidencia: ["evidence", "detail", "title", "photo2"],
  mapa: ["map", "title", "photo"],
  linha: ["timeline", "photo", "title"],
  numero: ["photo", "photo", "title"],
  citacao: ["quote", "photo", "title"],
  fechamento: ["quote", "photo", "end"],
};

export const shotsFor = (sc: Scene): Shot[] => {
  const d = sc.end - sc.start;
  const seq = kinds[sc.kind] || kinds.dossie;
  const n = d >= 9 ? 5 : d >= 6.5 ? 4 : d >= 4 ? 3 : 2;
  const ratios = sc.kind === "fechamento" && n === 5 ? [0.2, 0.2, 0.18, 0.17, 0.25]
    : n === 5 ? [0.28, 0.22, 0.2, 0.17, 0.13] : n === 4 ? [0.32, 0.26, 0.24, 0.18] : n === 3 ? [0.4, 0.32, 0.28] : [0.55, 0.45];
  const out: Shot[] = [];
  let t = sc.start;
  for (let i = 0; i < n; i++) {
    const len = d * ratios[i];
    out.push({from: t, to: i === n - 1 ? sc.end : t + len, type: seq[i % seq.length], a: sc.a, b: sc.b, c: sc.c});
    t += len;
  }
  if (sc.kind === "fechamento" && out.length) out[out.length - 1].type = "end";
  if (sc.kind === "abertura" && out.length) out[0].type = "title";
  return out;
};

const ShotBody: React.FC<{sc: Scene; shot: Shot; localAt: number; chapter?: number}> = ({sc, shot, localAt, chapter = 1}) => {
  const {W, H, V} = useDims();
  const fr = useCurrentFrame();
  const t = shot.type;
  const a = isImg(shot.a) ? shot.a! : undefined;
  const b = isImg(shot.b) ? shot.b! : undefined;
  const c = isImg(shot.c) ? shot.c! : undefined;
  const dark = t === "evidence" || t === "end";
  const bg = dark ? "v00" : ["v06", "v01", "v16", "v05", "v17"][Math.abs((sc.head || "").length) % 5];

  const base = (
    <>
      {dark ? <DarkBG /> : <PaperBG src={bg} dark={t === "title" ? 0.16 : 0.22} />}
      <Filmstrip y={0.972} at={0.1} h={0.062} speed={0.45} reverse={fr % 2 === 0} />
    </>
  );

  if (t === "title" || t === "quote") {
    return (
      <AbsoluteFill>
        {base}
        <Camera z={[1.03, 1.1]} x={[0, -8]}>
          <Headline kicker={sc.kicker} head={sc.head} line={sc.line} x={0.5} y={0.46} w={0.62} at={0.05} size={t === "quote" ? 0.92 : 1} />
          <Tape x={0.2} y={0.19} w={0.2} rot={-8} at={0.2} />
          <Tape x={0.79} y={0.72} w={0.18} rot={6} at={0.3} />
          <Pin x={0.22} y={0.2} at={0.22} />
          
          {sc.note && <Caption t={sc.note} x={0.79} y={0.8} at={0.9} w={0.24} font="hand" size={1.5} color={RED} align="center" />}
          {sc.stamp && <StampMark t={sc.stamp} x={0.8} y={0.3} at={0.75} rot={-12} size={H * 0.048} />}
        </Camera>
      </AbsoluteFill>
    );
  }

  if (t === "photo" || t === "photo2" || t === "detail") {
    const src = (t === "photo2" || t === "detail" ? (b || c || a) : a) || a || b || c;
    if (!src) return <AbsoluteFill>{base}<Headline kicker={sc.kicker} head={sc.head} line={sc.line} at={0.1} /></AbsoluteFill>;
    const isDetail = t === "detail";
    return (
      <AbsoluteFill>
        {base}
        <Camera z={isDetail ? [1.12, 1.24] : [1.0, 1.05]} x={isDetail ? [30, -20] : [0, 0]}>
          <Photo src={src} x={isDetail ? 0.5 : 0.56} y={isDetail ? 0.5 : 0.52} w={isDetail ? 0.86 : 0.52} rot={isDetail ? 0 : (V ? -3 : -2)} at={0.04}
            frame={isDetail ? "none" : "print"} tone={sc.tone === "bw" ? "bw" : "sepia"} tape={!isDetail} pin={!isDetail} z={7} par={0.5} />
          
          {!isDetail && <Pin x={0.3} y={0.19} at={0.2} />}
          
          {sc.line && <Caption t={sc.line} x={isDetail ? 0.5 : 0.2} y={isDetail ? 0.8 : 0.78} at={0.35} w={isDetail ? 0.78 : 0.34} align={isDetail ? "center" : "left"} color={dark ? "#e7dcc5" : INK2} box />}
          {isDetail && sc.note && <Caption t={sc.note} x={0.78} y={0.2} at={0.8} w={0.24} font="hand" size={1.5} color={RED} align="center" />}
          {isDetail && sc.stamp && <StampMark t={sc.stamp} x={0.25} y={0.79} at={0.9} size={H * 0.045} rot={-9} />}
          
        </Camera>
      </AbsoluteFill>
    );
  }

  if (t === "evidence") {
    const src = a || b || c;
    return (
      <AbsoluteFill>
        {base}
        <AbsoluteFill style={{background: "radial-gradient(circle at 50% 45%, rgba(200,30,38,.18), transparent 60%)"}} />
        {src && <Photo src={src} x={0.64} y={0.5} w={0.46} rot={2.2} at={0.05} frame="print" tone="bw" tape={false} z={8} />}
        <EvidenceTape y={0.12} t="REGISTRO" at={0.35} rot={-4} />
        <EvidenceTape y={0.9} t={sc.stamp || "ARQUIVO"} at={0.5} rot={3} color="#e8dfc9" />
        <Headline kicker={sc.kicker} head={sc.head} line={sc.line} x={0.2} y={0.47} w={0.31} at={0.15} paper={false} dark size={0.56} align="left" />
        <StampMark t={sc.stamp || "ARQUIVO"} x={0.79} y={0.76} at={0.8} size={H * 0.038} rot={-14} rare />
        {sc.note && <Caption t={sc.note} x={0.77} y={0.28} at={0.9} w={0.22} font="hand" size={1.4} color="#f0c9c3" align="center" />}
      </AbsoluteFill>
    );
  }

  if (t === "doc") {
    const src = a || b || c;
    if (!src) return <AbsoluteFill>{base}<Headline kicker={sc.kicker} head={sc.head} line={sc.line} at={0.1} /></AbsoluteFill>;
    return (
      <AbsoluteFill>
        {base}
        <Camera z={[1.02, 1.1]}>
          <DocShot src={src} x={0.58} y={0.5} w={0.4} rot={-2.5} at={0.06} marks={[[20, 18, 60, 6], [22, 30, 52, 5]]} />
          <Headline kicker={sc.kicker} head={sc.head} line={sc.line} x={0.23} y={0.44} w={0.33} at={0.2} size={0.72} align="left" />
          <Caption t="registro do arquivo" x={0.58} y={0.86} at={1.4} w={0.32} align="center" size={0.9} />
          <Pin x={0.4} y={0.2} at={0.4} />
        </Camera>
      </AbsoluteFill>
    );
  }

  if (t === "number") {
    return (
      <AbsoluteFill>
        {base}
        <Camera z={[1.03, 1.12]}>
          <BigNumber n={sc.head.replace(/[^\d.,]/g, "").slice(0, 6) || "12"} sub={sc.line || sc.head} at={0} />
          <Scribble x={0.3} y={0.63} w={0.4} at={0.45} />
          {sc.stamp && <StampMark t={sc.stamp} x={0.73} y={0.3} at={0.7} size={H * 0.05} />}
          <FileLabel t="ARQUIVO // DOCUMENTO" x={0.16} y={0.12} at={0.2} />
        </Camera>
      </AbsoluteFill>
    );
  }

  if (t === "chapter") {
    return (
      <AbsoluteFill>
        <PaperBG src="v20" dark={0.08} />
        <Filmstrip y={0.955} at={0} h={0.06} speed={0.35} />
        <Camera z={[1.02, 1.06]}>
          <ChapterCard n={chapter} t={sc.head} sub={sc.line} at={0.15} />
          <Tape x={0.2} y={0.2} w={0.22} rot={-10} at={0.1} />
          <Tape x={0.8} y={0.2} w={0.22} rot={9} at={0.1} />
        </Camera>
        <PaperWipe at={sc.start + (sc.end - sc.start) * 0.82} dur={0.5} />
      </AbsoluteFill>
    );
  }

  if (t === "timeline") {
    return (
      <AbsoluteFill>
        {base}
        <Camera z={[1.02, 1.08]}>
          <Headline kicker={sc.kicker} head={sc.head} x={0.5} y={0.25} w={0.56} at={0.05} size={0.8} />
          <TimelineShot at={0.2} items={[{a: "2014", t: "prisão"}, {a: "2017", t: "condenação"}, {a: "2024", t: "congresso"}, {a: "2026", t: "hoje"}]} />
          <Caption t={sc.line || sc.head} x={0.5} y={0.82} at={0.9} w={0.6} align="center" />
        </Camera>
      </AbsoluteFill>
    );
  }

  if (t === "map") {
    const src = "v10";
    return (
      <AbsoluteFill>
        <PaperBG src={src} dark={0.05} tone="red" />
        <AbsoluteFill style={{background: "rgba(12,6,4,.25)"}} />
        <Camera z={[1.06, 1.14]} x={[-20, 20]}>
          <Headline kicker={sc.kicker} head={sc.head} line={sc.line} x={0.5} y={0.22} w={0.54} at={0.05} size={0.8} paper dark />
          <MapRoute at={0.35} />
          <Pin x={0.245} y={0.40} at={0.45} color="#e8c35a" />
          <Pin x={0.795} y={0.585} at={0.65} color="#e8c35a" />
          <Pin x={0.845} y={0.71} at={0.85} color="#e8c35a" />
          <Caption t="CHICAGO → HONG KONG → GUANGZHOU → AUSTRÁLIA" x={0.5} y={0.79} at={1.0} w={0.66} align="center" color="#f0dfc6" size={1.15} />
        </Camera>
      </AbsoluteFill>
    );
  }

  if (t === "end") {
    return (
      <AbsoluteFill>
        <DarkBG />
        <Camera z={[1.04, 1.12]}>
          <EndTitle at={0.3} />
          <FileLabel t="FIM // SEU DOCUMENTÁRIO" x={0.5} y={0.86} at={1.2} />
        </Camera>
      </AbsoluteFill>
    );
  }

  return <AbsoluteFill>{base}<Headline kicker={sc.kicker} head={sc.head} line={sc.line} at={0.1} /></AbsoluteFill>;
};

/* ------------------------------------------------------------------ cena com planos e transições */
export const VoxScene: React.FC<{sc: Scene}> = ({sc}) => {
  const shots = shotsFor(sc);
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: "#0f0c09"}}>
      {shots.map((s, i) => {
        const from = Math.round((s.from - sc.start) * fps);
        const dur = Math.max(2, Math.round((s.to - s.from) * fps));
        return (
          <AbsoluteFill key={i} style={{display: "contents"}}>
            <SceneShift from={from} dur={dur}>
              <ShotBody sc={sc} shot={s} localAt={from / fps} chapter={sc.chapter} />
              {i > 0 && s.type !== "end" && <PaperWipe at={0} dur={0.4} on={sc.kind === "evidencia" ? "dark" : "light"} />}
              {i > 2 && i % 3 === 0 && <CutFlash />}
            </SceneShift>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

const CutFlash: React.FC = () => {
  const fr = useCurrentFrame();
  const o = fr < 4 ? 0.55 * (1 - fr / 4) : 0;
  return <AbsoluteFill style={{background: "#fff6e2", opacity: o, zIndex: 45, pointerEvents: "none"}} />;
};

/* Sequence que dura só o plano */
const SceneShift: React.FC<{from: number; dur: number; children: React.ReactNode}> = ({from, dur, children}) => (
  <Sequence from={from} durationInFrames={dur} layout="none">{children}</Sequence>
);
