"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  MarchingCubes,
  MarchingCube,
  PerspectiveCamera,
  Environment,
  Float,
  ContactShadows,
  Sphere,
  Box,
  SpotLight,
  RandomizedLight,
  Caustics,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { LayerMaterial, Base, Depth, Noise } from "lamina";

export const RocketCanvasMetaball = () => {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none">
        <Canvas dpr={[1, 2]}>
          <PerspectiveCamera
            makeDefault
            position={[0, 0.3, 1.7]}
            rotation={[Math.PI * 0.05 * -1, 0, 0]}

            // rotation={[Math.PI * 0.1, Math.PI * 0.5, Math.PI * 0.2]}
          />
          <color attach="background" args={["#fff"]} />
          <pointLight position={[10, 10, 5]} />
          <pointLight position={[-10, -10, -5]} />
          <ambientLight intensity={0.4} />
          <spotLight
            intensity={0.5}
            angle={0.1}
            penumbra={1}
            position={[10, 15, 10]}
            castShadow
          />
          {/* <Background /> */}

          <OrbitControls />
          <Scene />

          {/* <Environment
            preset="warehouse"
            environmentIntensity={1}
            // background={true}
          /> */}
        </Canvas>
      </div>
    </>
  );
};

function Scene() {
  const sound = useRef();
  const dataArray = useRef([]);
  const analyser = useRef();
  const frequency = useRef();

  function initialize() {
    const audioContext = new window.AudioContext();
    const source = audioContext.createMediaElementSource(sound.current);
    analyser.current = audioContext.createAnalyser();
    source.connect(analyser.current);
    analyser.current.connect(audioContext.destination);
    analyser.current.fftSize = 32;
    dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
  }

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (!analyser.current) return;
    analyser.current.getByteFrequencyData(dataArray.current);
    frequency.current = dataArray.current;
    // console.log(frequency.current);
  });

  return (
    <>
      <RocketScene sound={sound} frequency={frequency} position={[0, 0, 0]} />

      <Html as="div">
        <audio
          id="myAudio"
          src="sante.mp3"
          controls
          onPlay={initialize}
          ref={sound}
        />
      </Html>
    </>
  );
}

function RocketScene({ sound, frequency, position }) {
  const cloud = useRef();
  const lightRef = useRef();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    cloud.current.rotation.y = time * 0.03;
    cloud.current.position.y = Math.sin(time) * 0.01;
    if (!lightRef.current) return;
    lightRef.current.rotation.z = Math.sin(time) * 10;
  }, []);

  return (
    <>
      <RandomizedLight
        castShadow
        amount={8}
        frames={100}
        position={[5, 5, -10]}
      />
      <Suspense fallback={null}>
        <MarchingCubes
          ref={cloud}
          resolution={35}
          maxPolyCount={20000}
          enableUvs={false}
          enableColors={true}
          scale={1}
          position={position}
        >
          <meshPhysicalMaterial
            metalness={0.5}
            roughness={0.1}
            reflectivity={1}
            transmission={1}
            opacity={1}
            ior={1}
            thickness={0.01}
            specularIntensity={1}
            specularColor={"#fff"}
            envMapIntensity={2}
            exposure={0.1}
            color={"#888888"}
          />
          {/* <meshPhysicalMaterial
            map={colorMap}
            attach={"material"}
            scale={0.1}
          /> */}

          {Array(32)
            .fill(null)
            .map((_, index) => (
              <Metaball
                strength={0.5}
                key={index}
                order={index % 16}
                frequency={frequency}
              />
            ))}
          {/* <MarchingPlane planeType="y" strength={0.5} subtract={12} />
          <MarchingPlane planeType="x" strength={0.5} subtract={12} />
          <MarchingPlane planeType="z" strength={0.5} subtract={12} /> */}
        </MarchingCubes>
      </Suspense>
      <Environment background={true} resolution={64}>
        <mesh scale={100} ref={lightRef}>
          <sphereGeometry args={[1, 64, 64]} />
          <LayerMaterial
            side={THREE.BackSide}
            color="#fff"
            alpha={1}
            mode="normal"
          >
            <Depth
              colorA="#ff0000"
              colorB="#000"
              alpha={1}
              mode="normal"
              near={0}
              far={300}
              origin={[400, 400, 400]}
            />
            <Noise mapping="local" type="cell" scale={0.2} mode="add" />
          </LayerMaterial>
        </mesh>
      </Environment>
    </>
  );
}

function Metaball({ strength, pos, order, frequency }) {
  const [position, setPosition] = useState([0, 0, 0]);
  const [direction, setDirection] = useState("");
  const speed = randomIntFromInterval(-1, 1);
  const delay = randomIntFromInterval(1, 10);

  const ref = useRef();

  function randomIntFromInterval(min, max) {
    // min and max included
    return Math.random() * (max - min + 1) + min;
  }

  useEffect(() => {
    setPosition([
      randomIntFromInterval(-50, 50) / 100,
      randomIntFromInterval(-20, 20) / 100,
      randomIntFromInterval(-50, 50) / 100,
    ]);
    setDirection(order % 2 ? "x" : order % 3 ? "y" : "both");
    delay;
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    const f = frequency?.current?.[order] * 0.006;

    ref.current.position.y = THREE.MathUtils.lerp(
      ref.current.position.y,
      !f
        ? position[1] + Math.sin(time * 0.01) * speed * 0.5
        : (f - position[1] - 0.5) * 0.6 * speed,
      delay / 10
    );
  }, []);

  return (
    <MarchingCube
      strength={strength}
      subtract={28}
      position={position}
      ref={ref}
      color={"#fff"}
    />
  );
}
