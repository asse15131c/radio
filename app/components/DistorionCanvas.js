"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { AudioReactiveImage } from "./AudioReactiveImage";
import { OrbitControls } from "@react-three/drei";

export function DistorionCanvas({}) {
  return (
    <div className="fixed inset-0">
      <Canvas
        dpr={[1, 2]}
        flat
        linear
        legacy
        gl={{ antialias: false, alpha: true }}
      >
        <Scene />
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export function Scene() {
  const { viewport } = useThree();

  return (
    <>
      <AudioReactiveImage
        scale={[viewport.width, viewport.height, 1]}
        segments={600}
        url="/rr.jpg"
        // url="https://images.squarespace-cdn.com/content/v1/53d6c3efe4b07a1cdbbae414/1717706556197-8GJUDLIXGAONLQGPI4UK/THEREISSOMETHING_030.jpeg?format=1500w"
        // url="https://images.squarespace-cdn.com/content/v1/53d6c3efe4b07a1cdbbae414/1720136248761-XIIUVAADLW22J489ZFTX/SPECIAL_198_FAYDAEXE.jpg?format=1000w"
      />
    </>
  );
}
