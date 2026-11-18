import React from "react";
import {Composition} from "remotion";
import {Video, TOTAL, LARGURA, ALTURA} from "./Video";

export const Root: React.FC = () => (
  <Composition id="Video" component={Video} durationInFrames={Math.round(TOTAL * 30)} fps={30} width={LARGURA} height={ALTURA} />
);
