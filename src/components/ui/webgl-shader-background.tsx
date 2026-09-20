"use client";

import { useEffect, useRef } from "react";

/**
 * WebGL Canvas Background Shader
 * Renders full-screen continuous reactive Obsidian Emerald & Imperial Gold fluid motion
 * with simplex noise domain warping and mouse reactivity.
 */
export function WebGLShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      return;
    }

    const glContext = gl as WebGLRenderingContext;

    // Vertex Shader
    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader directly utilizing Obsidian Emerald & Imperial Gold GLSL
    const fsSource = `
      precision highp float;

      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ; m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
      }

      void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          vec2 mouse = u_mouse / u_resolution.xy;
          
          float t = u_time * 0.12;
          
          // Multi-octave organic domain warping
          vec2 q = vec2(0.0);
          q.x = snoise(uv * 1.5 + vec2(t * 0.3, t * 0.2));
          q.y = snoise(uv * 1.5 + vec2(t * 0.2, -t * 0.3));
          
          vec2 r = vec2(0.0);
          r.x = snoise(uv * 2.2 + 1.2 * q + vec2(1.7, 9.2) + 0.12 * t + mouse * 0.15);
          r.y = snoise(uv * 2.2 + 1.2 * q + vec2(8.3, 2.8) + 0.1 * t);
          
          float f = snoise(uv * 1.2 + r * 1.4);
          f = 0.5 + 0.5 * f;
          
          // Obsidian Emerald & Imperial Gold Palette
          vec3 deepObsidian = vec3(0.015, 0.045, 0.03);
          vec3 forestJade   = vec3(0.03, 0.13, 0.08);
          vec3 emeraldGlow  = vec3(0.06, 0.45, 0.24);
          vec3 electricMint = vec3(0.09, 0.78, 0.38);
          vec3 goldAccent   = vec3(0.92, 0.72, 0.16);
          
          // Color blending
          vec3 color = mix(deepObsidian, forestJade, clamp(f * 1.3, 0.0, 1.0));
          color = mix(color, emeraldGlow, clamp(length(q) * 0.65, 0.0, 1.0));
          color = mix(color, electricMint, pow(f, 3.5) * 0.35);
          
          // Shimmer gold line
          float goldShimmer = smoothstep(0.74, 0.88, snoise(uv * 3.5 + r * 1.8 - t * 0.15));
          color += goldAccent * goldShimmer * 0.14;
          
          // Mouse subtle spot
          float distMouse = length(uv - mouse);
          color += electricMint * (0.05 / (distMouse * distMouse + 0.2)) * 0.12;
          
          // Soft vignette
          float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
          color *= clamp(14.0 * vignette + 0.2, 0.0, 1.0);
          
          gl_FragColor = vec4(color, 1.0);
      }
    `;

    function createShader(glInstance: WebGLRenderingContext, type: number, source: string) {
      const shader = glInstance.createShader(type);
      if (!shader) return null;
      glInstance.shaderSource(shader, source);
      glInstance.compileShader(shader);
      if (!glInstance.getShaderParameter(shader, glInstance.COMPILE_STATUS)) {
        console.warn("Shader error:", glInstance.getShaderInfoLog(shader));
        glInstance.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(glContext, glContext.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(glContext, glContext.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = glContext.createProgram();
    if (!program) return;
    glContext.attachShader(program, vertexShader);
    glContext.attachShader(program, fragmentShader);
    glContext.linkProgram(program);

    if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
      console.warn("Program link error:", glContext.getProgramInfoLog(program));
      return;
    }

    const positionBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    glContext.bufferData(glContext.ARRAY_BUFFER, positions, glContext.STATIC_DRAW);

    const positionLocation = glContext.getAttribLocation(program, "position");
    const timeLocation = glContext.getUniformLocation(program, "u_time");
    const resolutionLocation = glContext.getUniformLocation(program, "u_resolution");
    const mouseLocation = glContext.getUniformLocation(program, "u_mouse");

    let mouseX = window.innerWidth * 0.5;
    let mouseY = window.innerHeight * 0.5;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = window.innerHeight - e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        glContext.viewport(0, 0, canvas.width, canvas.height);
      }
    }

    window.addEventListener("resize", resize);
    resize();

    const startTime = performance.now();
    let animationFrameId: number;

    function render() {
      const currentTime = (performance.now() - startTime) * 0.001;
      glContext.useProgram(program);

      glContext.bindBuffer(glContext.ARRAY_BUFFER, positionBuffer);
      glContext.enableVertexAttribArray(positionLocation);
      glContext.vertexAttribPointer(positionLocation, 2, glContext.FLOAT, false, 0, 0);

      glContext.uniform1f(timeLocation, currentTime);
      glContext.uniform2f(resolutionLocation, canvas!.width, canvas!.height);
      glContext.uniform2f(mouseLocation, mouseX, mouseY);

      glContext.drawArrays(glContext.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
      if (program) glContext.deleteProgram(program);
      if (vertexShader) glContext.deleteShader(vertexShader);
      if (fragmentShader) glContext.deleteShader(fragmentShader);
      if (positionBuffer) glContext.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" data-purpose="shader-background-container">
      <canvas ref={canvasRef} className="w-full h-full block opacity-70" />
      {/* Vignette overlay to reinforce sovereign dark luxury ambiance */}
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950/60 via-transparent to-obsidian-950/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(3,10,6,0.7)_100%)]" />
    </div>
  );
}
