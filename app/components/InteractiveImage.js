"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial, useTexture } from "@react-three/drei";

import { snoise2 } from "./noise";

const ThreeImageMaterialImpl = shaderMaterial(
  {
    color: new THREE.Color(),
    scale: 1,
    imageBounds: 1,
    resolution: 1024,
    map: null,
    zoom: 1,
    radius: 0,
    grayscale: 0,
    opacity: 1,
    u_time: 0.0,
    u_amplitude: 2.0,
    u_frequency: 1.0,
    u_octaves: 4,
    u_sound: new Uint8Array(512),
    // u_sound: new Uint8Array(512),
    // u_sound: [
    //   40.0, 50.0, 46.0, 44.0, 47.0, 129.0, 183.0, 201.0, 196.0, 183.0, 157.0,
    //   149.0, 138.0, 126.0, 137.0, 123.0, 124.0, 126.0, 96.0, 64.0, 105.0, 128.0,
    //   152.0, 147.0, 107.0, 69.0, 54.0, 87.0, 105.0, 92.0, 49.0, 39.0, 60.0,
    //   86.0, 87.0, 73.0, 50.0, 35.0, 35.0, 38.0, 68.0, 94.0, 98.0, 99.0, 136.0,
    //   144.0, 121.0, 69.0, 97.0, 112.0, 98.0, 58.0, 17.0, 10.0, 69.0, 116.0,
    //   128.0, 109.0, 68.0, 50.0, 32.0, 71.0, 114.0, 122.0,
    // ],
  },
  /* glsl */ `
  varying float x;
  varying float y;
  varying float z;
  varying vec2 vUv;

  uniform float u_time;
  uniform sampler2D map;
  uniform float u_frequency;
  uniform float u_amplitude;
  uniform int u_octaves;
  uniform vec2 u_mouse;
  uniform float[64] u_sound;

  varying float v_depth;

  ${snoise2}

  float PI = 3.14159265;

  vec3 bendVertexAroundCylinder(vec3 pos, float radius) {
    // Calcola l'angolo di inclinazione basato sulla posizione x
    float theta = pos.y / radius;

    // Calcola la nuova posizione sulla superficie del cilindro
    float x = radius * sin(theta);
    float y = pos.y ;  // Mantieni la stessa posizione lungo l'asse y
    float z = radius * cos(theta);

    return vec3(x, y, z);
}

float random(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

  void main() {
    vUv = uv;

    vec3 newPosition = position;
    // Calculate brightness
    vec4 color = texture2D(map, vUv);
    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));


    float f = u_frequency;
    float a = u_amplitude;

    float t = mod(u_time * 0.5, 100.0);

    // for(int i = 0; i < u_octaves; i++) {
    //   newPosition.z += snoise(uv.xy * f + vec2(t, 0.)) * a;
    //   f *= 2.0;
    //   a *= 0.5;
    // }
    
    x = abs(position.x);
    y = abs(position.y);

    float floor_x = x;
    float floor_y = y;

    highp int indexX = int(floor(floor_x * 64.0)); // Indice tra 0 e 64
    highp int indexY = int(floor(floor_y * 64.0)); // Indice tra 0 e 64

    // float x_multiplier = (32.0 - indexX) / 8.0;
    // float y_multiplier = (32.0 - indexY) / 8.0;

      // TERRAIN
      newPosition.z += abs(newPosition.z);
      newPosition.z += (1.0 - brightness);
      v_depth = clamp(newPosition.z * 0.5, 0.0, 1.0);

    // TESTTTT
    // int index = int(floor(floor_x) * 64.0));
    // float xIndex = floor((position.x + 1.0) * 31.5); // Da -1 a 1 => 0 a 63
    // xIndex = clamp(xIndex, 0.0, 63.0); // Assicurati che l'indice sia tra 0 e 63
    
    // Applica il movimento in base all'intensità del suono (u_sound) int(xIndex)
    // float soundValue = u_sound[int(index)] / 500.0; // Normalizza da 0 a 1
    
    // Modifica la posizione Z in base al valore del suono
    // newPosition.z += soundValue * 2.0 ; // Amplifica l'effetto
    newPosition.z += sin(u_sound[int(indexX)] / 50. + u_sound[int(indexY)] / 50.) / 6.;
    // newPosition.z += (u_sound[int(x)] / 255.0 + u_sound[int(y)] / 255.0) * u_amplitude;
    // newPosition.z = u_sound[int(x)] / 255.0 + u_sound[int(y)] / 255.0 * u_amplitude;
    
  

    // float z = sin(u_sound[floor_x] + u_sound[floor_y])  * 0.006;
    // newPosition.z += u_sound[0] / 200.0;
    // newPosition.z = sin(u_sound[int(floor_x)] + u_sound[int(floor_y)]) * 0.006;

    // newPosition = bendVertexAroundCylinder(newPosition, .2);
    // Modify the Z position based onthe brightness

    // Rotate the vertices based on time and UV coordinates
    // float angle = u_time * 0.5;
    // float quadrantAngle = floor(mod(vUv.y * 15.0, 15.0)) * PI ;
    // float totalAngle = angle + quadrantAngle;
    // newPosition.xz = mat2(cos(totalAngle), -sin(totalAngle), sin(totalAngle), cos(totalAngle)) * newPosition.xz;
    // newPosition.zx = mat2(cos(totalAngle), -sin(totalAngle), sin(totalAngle), cos(totalAngle)) * newPosition.xz;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
  }

`,
  /* glsl */ `
  varying vec2 vUv;
  uniform vec2 scale;
  uniform vec2 imageBounds;
  uniform float resolution;
  uniform vec3 color;
  uniform sampler2D map;
  uniform float radius;
  uniform float zoom;
  uniform float grayscale;
  uniform float opacity;

  varying float v_depth;

  vec3 duotoneLightColor = vec3(128.0, 13.0, 255.0);  // Colore chiaro del duotone
  vec3 duotoneDarkColor = vec3(0.0, 0.0, 0.0);   // Colore scuro del duotone


  vec3 luma = vec3(.299, 0.587, 0.114);
  vec4 toGrayscale(vec4 color, float intensity) {
    return vec4(mix(color.rgb, vec3(dot(color.rgb, luma)), intensity), color.a);
  }
  vec2 aspect(vec2 size) {
    return size / min(size.x, size.y);
  }

  float PI = 3.14159265;

  float udRoundBox(vec2 p, vec2 b, float r) {
    return length(max(abs(p)-b+r,0.0))-r;
  }

  void main() {
    vec2 s = aspect(scale);
    vec2 i = aspect(imageBounds);
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = vUv * s / new + offset;

    vec2 zUv = (uv - vec2(0.5, 0.5)) / zoom + vec2(0.5, 0.5);

    vec2 res = vec2(scale * resolution);
    vec2 halfRes = 0.5 * res;
    float b = udRoundBox(vUv.xy * res - halfRes, halfRes, resolution * radius);
    vec3 a = mix(vec3(1.0,0.0,0.0), vec3(0.0,0.0,0.0), smoothstep(0.0, 1.0, b));

    vec4 imageColor = texture2D(map, zUv) * vec4(color, opacity * a);
    imageColor.rgb *= (1.0 - v_depth); // Darken based on depth

    vec4 grayscaleColor = toGrayscale(imageColor, grayscale);
    float luminance = dot(imageColor.rgb, luma * 0.005); // Calcolo della luminosità
    
    gl_FragColor = toGrayscale(imageColor, grayscale);
    // vec3 duotoneColor = mix(duotoneDarkColor, duotoneLightColor, luminance); // Interpolazione tra i due colori
    // gl_FragColor = vec4(duotoneColor, grayscaleColor.a); // Imposta il colore del frammento
  }
`
);

const ImageBase = forwardRef(
  (
    {
      analyser,
      children,
      color,
      segments = 1,
      scale,
      zoom = 1,
      grayscale = 0,
      opacity = 1,
      radius = 0,
      texture,
      toneMapped,
      transparent,
      side,
      frequency,
      ...props
    },
    fref
  ) => {
    extend({ ThreeImageMaterialImpl: ThreeImageMaterialImpl });

    const ref = useRef(null);
    const { scene, viewport } = useThree();

    const uniforms = useMemo(
      () => ({
        u_time: {
          value: 25.0,
        },
        u_amplitude: {
          value: 0.2,
        },
        u_frequency: {
          value: 2.0,
        },
        u_octaves: {
          value: 10.0,
        },
        u_mouse: {
          value: new THREE.Vector2(),
        },
        u_sound: {
          type: "float[64]",
          // value: new Uint8Array(512),
          value: [
            40, 50, 46, 44, 47, 129, 183, 201, 196, 183, 157, 149, 138, 126,
            137, 123, 124, 126, 96, 64, 105, 128, 152, 147, 107, 69, 54, 87,
            105, 92, 49, 39, 60, 86, 87, 73, 50, 35, 35, 38, 68, 94, 98, 99,
            136, 144, 121, 69, 97, 112, 98, 58, 17, 10, 69, 116, 128, 109, 68,
            50, 32, 71, 114, 122,
          ],
        },
      }),
      []
    );

    const size = useThree((state) => state.size);
    const planeBounds = Array.isArray(scale)
      ? [scale[0], scale[1]]
      : [scale, scale];
    const imageBounds = [texture.image.width, texture.image.height];
    const resolution = Math.max(size.width, size.height);
    useImperativeHandle(fref, () => ref.current, []);
    useLayoutEffect(() => {
      if (ref.current.geometry.parameters) {
        ref.current.material.uniforms.scale.value = [
          planeBounds[0] * ref.current.geometry.parameters.width,
          planeBounds[1] * ref.current.geometry.parameters.height,
        ];
      }

      // ref.current.material.uniforms.u_amplitude = uniforms.u_amplitude.value;
      // ref.current.material.uniforms.u_frequency = uniforms.u_frequency.value;
      // ref.current.material.uniforms.u_octaves = uniforms.u_octaves.value;
    }, []);
    // useEffect(() => {
    //   console.log("frequenc", frequency.current);
    // }, [frequency]);

    // useFrame(({ clock }) => {
    //   ref.current.material.uniforms.u_time.value = clock.getElapsedTime();
    // });

    useFrame(({ pointer, clock }) => {
      // console.log("analyser", analyser.current?.frequencyBinCount);
      const x = (pointer.x * viewport.width) / 2;
      const y = (pointer.y * viewport.height) / 2;

      ref.current.material.uniforms.u_time.value = clock.getElapsedTime();
      uniforms.u_mouse.value.set(x, y);

      if (frequency.current) {
        // uniforms.u_sound.value = Object.values(frequency.current.slice(0, 64));
        ref.current.material.uniforms.u_sound.value = Object.values(
          frequency.current.slice(0, 64)
        );
        console.log(
          Array.isArray(uniforms.u_sound.value),
          uniforms.u_sound.value,
          "uniforms.u_sound.value"
        );
      }

      // uniforms.u_mouse.value.rotation.set(-y, x, 0);
      // console.log(uniforms.u_mouse.value, "uniforms.u_mouse.value");
    });

    return (
      <mesh
        ref={ref}
        scale={Array.isArray(scale) ? [...scale, 1] : scale}
        {...props}
        rotation={[-0.2 * Math.PI, 0, -0.15 * Math.PI]}
      >
        <planeGeometry args={[1, 1, segments, segments]} />
        <threeImageMaterialImpl
          color={color}
          map={texture}
          zoom={zoom}
          grayscale={grayscale}
          opacity={opacity}
          scale={planeBounds}
          imageBounds={imageBounds}
          resolution={resolution}
          radius={radius}
          toneMapped={toneMapped}
          transparent={transparent}
          side={side}
          key={ThreeImageMaterialImpl.key}
          u_frequency={uniforms.u_frequency.value}
          u_octaves={uniforms.u_octaves.value}
          u_amplitude={uniforms.u_amplitude.value}
          u_mouse={uniforms.u_mouse.value}
          // u_sound={uniforms.u_sound.value}
          wireframe
        />
        {children}
      </mesh>
    );
  }
);

ImageBase.displayName = "ImageBase";

const ImageWithUrl = forwardRef(({ url, ...props }, ref) => {
  const texture = useTexture(url);
  return <ImageBase {...props} texture={texture} ref={ref} />;
});

ImageWithUrl.displayName = "ImageWithUrl";

const ImageWithTexture = forwardRef(({ url: _url, ...props }, ref) => {
  return <ImageBase {...props} ref={ref} />;
});

ImageWithTexture.displayName = "ImageWithTexture";

export const InteractiveImage = forwardRef((props, ref) => {
  if (props.url) return <ImageWithUrl {...props} ref={ref} />;
  else if (props.texture) return <ImageWithTexture {...props} ref={ref} />;
  else throw new Error("<Image /> requires a url or texture");
});

InteractiveImage.displayName = "InteractiveImage";
