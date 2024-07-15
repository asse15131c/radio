"use client";

import {
  forwardRef,
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
    u_amplitude: 1.0,
    u_frequency: 1.0,
    u_octaves: 4,
  },
  /* glsl */ `
  varying vec2 vUv;
  uniform float u_time;
  uniform sampler2D map;
  uniform float u_frequency;
  uniform float u_amplitude;
  uniform int u_octaves;

  varying float v_depth;

  ${snoise2}


  float PI = 3.14159265;

  void main() {
    vUv = uv;

    vec3 newPosition = position;

    // Calculate brightness
    vec4 color = texture2D(map, vUv);
    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));


    float f = u_frequency;
    float a = u_amplitude;

    float t = mod(u_time * 0.5, 100.0);

    for(int i = 0; i < u_octaves; i++) {
      newPosition.z += snoise(uv.xy * f + vec2(t, 0.)) * a;
      f *= 2.0;
      a *= 0.5;
    }

    newPosition.z = abs(newPosition.z);
    newPosition.z += (1.0 - brightness);
    v_depth = clamp(newPosition.z * 0.5, 0.0, 1.0);
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

    gl_FragColor = toGrayscale(imageColor, grayscale);
  }
`
);

const ImageBase = forwardRef(
  (
    {
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
      ...props
    },
    fref
  ) => {
    extend({ ThreeImageMaterialImpl: ThreeImageMaterialImpl });

    const ref = useRef(null);

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

    useFrame(({ clock }) => {
      ref.current.material.uniforms.u_time.value = clock.getElapsedTime();
    });

    return (
      <mesh
        ref={ref}
        scale={Array.isArray(scale) ? [...scale, 1] : scale}
        {...props}
        rotation={[-0.2 * Math.PI, 0, -0.1 * Math.PI]}
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
          // wireframe
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
