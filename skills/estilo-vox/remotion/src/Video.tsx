import React from "react";
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {f, FPS, MONT, TYPE, TEMA} from "./lib";
import {VoxScene, Scene} from "./cenas";
import {RED, INK, ANTON} from "./vox";
import cenas from "./data/scenes.json";

export const LARGURA = 1920;
export const ALTURA = 1080;
// EDITE AQUI 1/4: duracao total do video, em segundos (igual ao fim da ultima cena)
export const TOTAL = 180;
TEMA.cor = RED;

const SCENES = cenas as unknown as Scene[];

// EDITE AQUI 2/4: capitulos. O primeiro comeca em 0; os demais ganham cartela de capitulo.
const CHAPTERS = [
  {t: 0.0, n: 1, title: "ABERTURA"},
  {t: 60.0, n: 2, title: "O FATO"},
  {t: 120.0, n: 3, title: "O DESFECHO"},
];

const chapterAt = (t: number) => {
  let c = CHAPTERS[0];
  for (const ch of CHAPTERS) if (t >= ch.t - 0.05) c = ch;
  return c;
};

const useDimsLocal = () => {
  const {width: W, height: H} = useVideoConfig();
  return {W, H};
};

/* ------------------------------------------------------------------ vinheta de capítulo (sobreposta) */
const ChapterOverlay: React.FC<{title: string; n: number}> = ({title, n}) => {
  const fr = useCurrentFrame();
  const {W, H} = useDimsLocal();
  const o = interpolate(fr, [0, 8, 44, 54], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const sc = interpolate(fr, [0, 20], [1.06, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{opacity: o, zIndex: 60}}>
      <AbsoluteFill style={{background: "#e7d9bb"}}>
        <Img src={staticFile("voxp/v16.jpg")} style={{width: "100%", height: "100%", objectFit: "cover", opacity: 0.9, transform: `scale(${sc})`}} />
        <AbsoluteFill style={{backgroundColor: "rgba(20,12,6,.22)", mixBlendMode: "multiply"}} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: "center", alignItems: "center"}}>
        <div style={{fontFamily: ANTON, fontSize: H * 0.62, lineHeight: 0.8, color: "rgba(200,30,38,.13)", position: "absolute", left: W * 0.04, top: H * 0.02, letterSpacing: -10}}>
          {String(n).padStart(2, "0")}
        </div>
        <div style={{transform: "rotate(-1.4deg)", textAlign: "center", zIndex: 2}}>
          <div style={{fontFamily: MONT, fontWeight: 900, fontSize: H * 0.02, letterSpacing: H * 0.014, color: RED}}>CAPÍTULO {String(n).padStart(2, "0")}</div>
          <div style={{fontFamily: ANTON, fontSize: H * 0.115, lineHeight: 0.94, color: INK, marginTop: H * 0.016, textTransform: "uppercase"}}>{title}</div>
          <div style={{width: W * 0.16, height: 7, background: RED, margin: `${H * 0.024}px auto 0`}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ HUD discreto */
const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ch = chapterAt(t);
  const {W, H} = useDimsLocal();
  const num = String(Math.floor(t / 12) + 1).padStart(3, "0");
  return (
    <AbsoluteFill style={{pointerEvents: "none", zIndex: 55}}>
      <div style={{position: "absolute", left: W * 0.028, top: H * 0.03, display: "flex", alignItems: "center", gap: 12, opacity: 0.62}}>
        <div style={{width: W * 0.006, height: H * 0.026, background: RED}} />
        <div style={{fontFamily: MONT, fontWeight: 800, fontSize: H * 0.014, letterSpacing: 2.4, color: "#f1e6d0", textShadow: "0 2px 6px rgba(0,0,0,.8)"}}>
          {`SEU DOCUMENTÁRIO   //   CAP. ${String(ch.n).padStart(2, "0")} · ${ch.title}`}
        </div>
      </div>
      <div style={{position: "absolute", right: W * 0.028, top: H * 0.03, fontFamily: TYPE, fontSize: H * 0.013, color: "#f1e6d0", opacity: 0.5, letterSpacing: 1.5}}>
        {`DOC ${num}`}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ musica */
const Music: React.FC<{file: string; from: number; to: number; vol?: number; loop?: boolean}> = ({file, from, to, vol = 0.1, loop}) => {
  const len = Math.max(1, f(to) - f(from));
  return (
    <Sequence from={f(from)} durationInFrames={len} layout="none">
      <Audio src={staticFile(`audio/musicas/${file}`)} loop={loop}
        volume={(fr) => vol * interpolate(fr, [0, 90, len - 120, len], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
    </Sequence>
  );
};

const Fx: React.FC<{n: string; at: number; v?: number}> = ({n, at, v = 0.45}) => (
  <Sequence from={Math.max(0, f(at))} layout="none"><Audio src={staticFile(`audio/efeitos/${n}.mp3`)} volume={v} /></Sequence>
);

/* ------------------------------------------------------------------ som */
const Som: React.FC = () => (
  <>
    <Sequence from={0} layout="none"><Audio src={staticFile("audio/narracao/voz.mp3")} volume={1} /></Sequence>
    {/* EDITE AQUI 3/4: trilha por bloco. Arquivos em public/audio/musicas/.
        vol ~0.12 a 0.18 fica de fundo, sem competir com a narracao. */}
    <Music file="trilha_1.mp3" from={0} to={95} vol={0.15} loop />
    <Music file="trilha_2.mp3" from={90} to={180} vol={0.13} loop />
    {SCENES.map((sc, i) => (
      <React.Fragment key={"fx" + i}>
        <Fx n="whoosh_soft" at={sc.start + 0.02} v={0.26} />
        {sc.stamp && <Fx n="stamp" at={sc.start + (sc.end - sc.start) * 0.55} v={0.38} />}
        {i % 2 === 0 && <Fx n="pin" at={sc.start + 0.3} v={0.2} />}
      </React.Fragment>
    ))}
    {CHAPTERS.slice(1).map((c, i) => <Fx key={"ch" + i} n="impact" at={c.t} v={0.35} />)}
  </>
);

/* ------------------------------------------------------------------ montagem */
export const Video: React.FC = () => (
  <AbsoluteFill style={{background: "#0f0c09"}}>
    {SCENES.map((sc, i) => {
      const ch = chapterAt(sc.start);
      const withChapter = {...sc, chapter: ch.n};
      const dur = Math.max(2, Math.round((sc.end - sc.start) * FPS));
      return (
        <Sequence key={i} from={Math.round(sc.start * FPS)} durationInFrames={dur} name={`${i} ${sc.head}`}>
          <VoxScene sc={withChapter} />
        </Sequence>
      );
    })}
    {CHAPTERS.slice(1).map((c) => (
      <Sequence key={"cap" + c.n} from={Math.round(c.t * FPS)} durationInFrames={56} name={`cap ${c.n}`}>
        <ChapterOverlay title={c.title} n={c.n} />
        <Fx n="paper" at={0} v={0.35} />
      </Sequence>
    ))}
    <Hud />
    <Som />
  </AbsoluteFill>
);
