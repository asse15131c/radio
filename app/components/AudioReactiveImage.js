import { Html } from "@react-three/drei";
import { InteractiveImage } from "./InteractiveImage";
import { useEffect, useRef, useState } from "react";

const AudioReactiveImage = (props) => {
  const soundRef = useRef();

  const [audioContext, setAudioContext] = useState(null);
  const [audioAnalyser, setAudioAnalyser] = useState(null);

  function initialize() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;

    soundRef.current.connect(analyser);
    analyser.connect(context.destination);

    setAudioContext(context);
    setAudioAnalyser(analyser);
  }

  return (
    <>
      <Html as="div">
        <audio src="sound.ogg" controls ref={soundRef} onPlay={initialize} />
      </Html>
      <InteractiveImage
        {...props}
        audioContext={audioContext}
        audioAnalyser={audioAnalyser}
      />
    </>
  );
};

export default AudioReactiveImage;
