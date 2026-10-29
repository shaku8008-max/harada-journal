"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";

type Color = [number, number, number];

type CanvasRevealEffectProps = {
  animationSpeed?: number;
  colors?: Color[];
  dotSize?: number;
  opacities?: number[];
};

type ShaderUniforms = {
  u_colors: { value: THREE.Vector3[] };
  u_opacities: { value: number[] };
  u_total_size: { value: number };
  u_dot_size: { value: number };
  u_time: { value: number };
  u_resolution: { value: THREE.Vector2 };
};

const defaultOpacities = [0.18, 0.18, 0.24, 0.3, 0.38, 0.48, 0.58, 0.68, 0.78, 0.92];

function RevealShader({ source, uniforms }: { source: string; uniforms: Omit<ShaderUniforms, "u_time" | "u_resolution"> }) {
  const { size } = useThree();
  const meshRef = React.useRef<THREE.Mesh>(null);

  const material = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        out vec2 fragCoord;
        void main() {
          gl_Position = vec4(position.xy, 0.0, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5;
        }
      `,
      fragmentShader: source,
      uniforms: {
        ...uniforms,
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(size.width * 2, size.height * 2) },
      },
      glslVersion: THREE.GLSL3,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [size.height, size.width, source, uniforms]);

  React.useEffect(() => {
    material.uniforms.u_resolution.value.set(size.width * 2, size.height * 2);
  }, [material, size.height, size.width]);

  useFrame(({ clock }) => {
    const currentMaterial = meshRef.current?.material;
    if (currentMaterial instanceof THREE.ShaderMaterial) {
      currentMaterial.uniforms.u_time.value = clock.getElapsedTime();
    }
  });

  React.useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export function CanvasRevealEffect({
  animationSpeed = 0.7,
  colors = [[196, 154, 255]],
  dotSize = 3,
  opacities = defaultOpacities,
}: CanvasRevealEffectProps) {
  const normalizedColors = [...colors, ...colors, ...colors].slice(0, 6).map((color) =>
    new THREE.Vector3(color[0] / 255, color[1] / 255, color[2] / 255),
  );
  const uniforms = React.useMemo(
    () => ({
      u_colors: { value: normalizedColors },
      u_opacities: { value: opacities },
      u_total_size: { value: 4 },
      u_dot_size: { value: dotSize },
    }),
    [dotSize, normalizedColors, opacities],
  );

  const source = React.useMemo(
    () => `
      precision mediump float;
      in vec2 fragCoord;
      uniform float u_time;
      uniform float u_opacities[10];
      uniform vec3 u_colors[6];
      uniform float u_total_size;
      uniform float u_dot_size;
      uniform vec2 u_resolution;
      out vec4 fragColor;

      float random(vec2 xy) {
        return fract(sin(dot(xy, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec2 pixel = fragCoord * u_resolution;
        vec2 grid = floor(pixel / u_total_size);
        float seed = random(grid);
        float phase = fract(u_time * ${animationSpeed.toFixed(2)} + seed);
        float opacity = u_opacities[int(seed * 10.0)];
        opacity *= smoothstep(0.0, 0.28, phase) * (1.0 - smoothstep(0.72, 1.0, phase));
        vec2 cell = fract(pixel / u_total_size);
        opacity *= 1.0 - step(u_dot_size / u_total_size, cell.x);
        opacity *= 1.0 - step(u_dot_size / u_total_size, cell.y);
        vec3 color = u_colors[int(seed * 6.0)];
        fragColor = vec4(color, opacity);
      }
    `,
    [animationSpeed],
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-90">
      <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: false }} frameloop="always" camera={{ position: [0, 0, 1] }}>
        <RevealShader source={source} uniforms={uniforms} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10" />
    </div>
  );
}
