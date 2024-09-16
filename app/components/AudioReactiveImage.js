"use client";

import { Html } from "@react-three/drei";
import { InteractiveImage } from "./InteractiveImage";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

export function AudioReactiveImage(props) {
  const soundRef = useRef();
  const dataArray = useRef(null);
  const analyser = useRef(null);
  const frequency = useRef(null);
  const audioContext = useRef(null);

  const setupAudioContext = () => {
    const audioContext = new window.AudioContext();
    const source = audioContext.createMediaElementSource(soundRef.current);
    analyser.current = audioContext.createAnalyser();
    source.connect(analyser.current);
    analyser.current.connect(audioContext.destination);
    analyser.current.fftSize = 1024;
    dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
  };

  function initialize() {
    if (!audioContext.current && !analyser.current) {
      setupAudioContext();
    }
  }

  useFrame(() => {
    if (!analyser.current) return;
    analyser.current.getByteFrequencyData(dataArray.current);
    frequency.current = dataArray.current;
    // console.log(frequency.current);
  });

  return (
    <>
      <Html as="div">
        <audio
          src="sante.mp3"
          controls
          ref={soundRef}
          onPlay={initialize}
          autoPlay
        />
      </Html>
      <InteractiveImage {...props} analyser={analyser} frequency={frequency} />
    </>
  );
}
