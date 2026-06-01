"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// ─── DotMatrix WebGL component ────────────────────────────────────────────
// Inspired by the AceternityUI / sign-in-flow CanvasRevealEffect.
// Reveals dots in a wave from center (intro) or edges (outro).

type Uniforms = Record<string, { value: number | number[] | number[][]; type: string }>;

interface ShaderProps {
  source: string;
  uniforms: Uniforms;
}

const ShaderMaterial: React.FC<ShaderProps> = ({ source, uniforms }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.ShaderMaterial;
    mat.uniforms.u_time.value = clock.getElapsedTime();
  });

  const material = useMemo(() => {
    const prepared: Record<string, THREE.IUniform> = {};
    for (const name in uniforms) {
      const u = uniforms[name];
      switch (u.type) {
        case "uniform1f":
          prepared[name] = { value: u.value as number };
          break;
        case "uniform1i":
          prepared[name] = { value: u.value as number };
          break;
        case "uniform1fv":
          prepared[name] = { value: u.value as number[] };
          break;
        case "uniform3fv":
          prepared[name] = {
            value: (u.value as number[][]).map((v) => new THREE.Vector3().fromArray(v)),
          };
          break;
        case "uniform2f":
          prepared[name] = { value: new THREE.Vector2().fromArray(u.value as number[]) };
          break;
        default:
          break;
      }
    }
    prepared.u_time = { value: 0 };
    prepared.u_resolution = { value: new THREE.Vector2(size.width * 2, size.height * 2) };

    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        uniform vec2 u_resolution;
        out vec2 fragCoord;
        void main(){
          gl_Position = vec4(position, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }
      `,
      fragmentShader: source,
      uniforms: prepared,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
  }, [size.width, size.height, source, uniforms]);

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms }) => (
  <Canvas className="absolute inset-0 h-full w-full" gl={{ antialias: false, alpha: true }}>
    <ShaderMaterial source={source} uniforms={uniforms} />
  </Canvas>
);

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  reverse?: boolean;
  animationSpeed?: number;
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[88, 204, 2]], // duo-green default
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  totalSize = 22,
  dotSize = 3,
  reverse = false,
  animationSpeed = 0.5,
}) => {
  const uniforms = useMemo<Uniforms>(() => {
    // Pad colors array to 6 entries (the shader expects 6).
    let colorsArray: number[][];
    if (colors.length === 1) colorsArray = Array(6).fill(colors[0]);
    else if (colors.length === 2)
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    else if (colors.length === 3)
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    else colorsArray = [...colors, ...Array(Math.max(0, 6 - colors.length)).fill(colors[colors.length - 1])].slice(0, 6);

    return {
      u_colors: {
        value: colorsArray.map((c) => [c[0] / 255, c[1] / 255, c[2] / 255]),
        type: "uniform3fv",
      },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
      u_reverse: { value: reverse ? 1 : 0, type: "uniform1i" },
      u_anim_speed: { value: animationSpeed, type: "uniform1f" },
    };
  }, [colors, opacities, totalSize, dotSize, reverse, animationSpeed]);

  const source = `
    precision mediump float;
    in vec2 fragCoord;
    uniform float u_time;
    uniform float u_opacities[10];
    uniform vec3 u_colors[6];
    uniform float u_total_size;
    uniform float u_dot_size;
    uniform vec2 u_resolution;
    uniform int u_reverse;
    uniform float u_anim_speed;
    out vec4 fragColor;

    float PHI = 1.61803398874989484820459;
    float random(vec2 xy) { return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x); }

    void main() {
      vec2 st = fragCoord.xy;
      st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
      st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

      float opacity = step(0.0, st.x);
      opacity *= step(0.0, st.y);

      vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
      float frequency = 5.0;
      float show_offset = random(st2);
      float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
      opacity *= u_opacities[int(rand * 10.0)];
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

      vec3 color = u_colors[int(show_offset * 6.0)];

      vec2 center_grid = u_resolution / 2.0 / u_total_size;
      float dist_from_center = distance(center_grid, st2);
      float timing_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
      float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
      float timing_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);

      float t = u_time * u_anim_speed;
      if (u_reverse == 1) {
        opacity *= 1.0 - step(timing_outro, t);
        opacity *= clamp(step(timing_outro + 0.1, t) * 1.25, 1.0, 1.25);
      } else {
        opacity *= step(timing_intro, t);
        opacity *= clamp((1.0 - step(timing_intro + 0.1, t)) * 1.25, 1.0, 1.25);
      }

      fragColor = vec4(color, opacity);
      fragColor.rgb *= fragColor.a;
    }
  `;

  return <Shader source={source} uniforms={uniforms} />;
};

// ─── Public component: CanvasRevealEffect ────────────────────────────────
interface CanvasRevealEffectProps {
  /** rgb colors as [[r,g,b], ...]. Default: duo-green. */
  colors?: number[][];
  opacities?: number[];
  dotSize?: number;
  /** Animation speed multiplier (0.3 = slow, 1.0 = fast). */
  animationSpeed?: number;
  /** Reverse: dots disappear from center outward (use on exit). */
  reverse?: boolean;
  /** Show a bottom-fade overlay so content is readable. */
  showGradient?: boolean;
  containerClassName?: string;
}

export function CanvasRevealEffect({
  colors = [[88, 204, 2], [28, 176, 246]], // duo-green + duo-blue
  opacities,
  dotSize = 3,
  animationSpeed = 0.6,
  reverse = false,
  showGradient = true,
  containerClassName,
}: CanvasRevealEffectProps) {
  return (
    <div className={cn("h-full w-full relative", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors}
          opacities={opacities}
          dotSize={dotSize}
          animationSpeed={animationSpeed}
          reverse={reverse}
        />
      </div>
      {showGradient && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, rgba(255,251,241,0.65) 80%)",
          }}
        />
      )}
    </div>
  );
}
