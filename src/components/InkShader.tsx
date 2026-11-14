import { useEffect, useRef } from 'react'
import { useReducedMotionPref } from '../hooks/useMedia'

/**
 * «Чернила матчи в воде» — domain-warped fbm-шум на чистом WebGL.
 * Курсор размешивает чернила; вне экрана и в скрытой вкладке шейдер засыпает.
 */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uIntro;
uniform float uStir;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++){ v += a*noise(p); p = r*p*2.02; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float s = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5*uRes) / s;
  vec2 m = (uMouse - 0.5) * uRes / s;

  float t = uTime * 0.045;
  float md = length(p - m);
  // курсор закручивает чернила вокруг себя
  float swirl = exp(-md*md*3.5) * (0.35 + uStir*1.4);
  float ang = swirl * 1.6;
  vec2 d = p - m;
  p = m + mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * d;

  vec2 q = vec2(fbm(p*1.6 + t), fbm(p*1.6 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p*1.6 + 3.5*q + vec2(1.7, 9.2) + t*1.4), fbm(p*1.6 + 3.5*q + vec2(8.3, 2.8) - t*1.1));
  float f = fbm(p*1.6 + 3.0*r);

  vec3 ink   = vec3(0.055, 0.078, 0.063);
  vec3 deep  = vec3(0.141, 0.224, 0.118);
  vec3 matcha= vec3(0.373, 0.541, 0.306);
  vec3 glow  = vec3(0.659, 0.776, 0.525);
  vec3 clay  = vec3(0.890, 0.608, 0.471);
  vec3 butter= vec3(0.922, 0.796, 0.510);

  vec3 col = mix(ink, deep, smoothstep(0.15, 0.75, f));
  col = mix(col, matcha, smoothstep(0.55, 0.95, f*length(q)) * 0.85);
  col = mix(col, glow, smoothstep(0.75, 1.15, f*r.x*1.6) * 0.55);
  col = mix(col, clay, smoothstep(0.62, 1.0, r.y*q.x*1.4) * 0.22);
  col = mix(col, butter, smoothstep(0.85, 1.2, f*r.y*1.7) * 0.25 * (1.0 + uStir));
  col += glow * 0.09 * exp(-md*md*6.0);

  float vig = smoothstep(1.25, 0.25, length((uv - vec2(0.5, 0.58)) * vec2(1.0, 1.25)));
  col = mix(ink, col, vig);
  col = mix(col, ink, smoothstep(0.35, 0.0, uv.y));
  col *= uIntro;

  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)
  if (!s) return null
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s)
    return null
  }
  return s
}

export function InkShader({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotionPref()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) {
      canvas.dataset.fallback = 'true'
      return
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()
    if (!vs || !fs || !prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    gl.useProgram(prog)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uMouse = gl.getUniformLocation(prog, 'uMouse')
    const uIntro = gl.getUniformLocation(prog, 'uIntro')
    const uStir = gl.getUniformLocation(prog, 'uStir')

    // половинное разрешение: шум мягкий, разницы не видно, GPU отдыхает
    const SCALE = 0.5
    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * SCALE))
      const h = Math.max(1, Math.floor(canvas.clientHeight * SCALE))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      gl.uniform2f(uRes, w, h)
    }

    const mouse = { x: 0.62, y: 0.55, tx: 0.62, ty: 0.55, stir: 0 }
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width
      const ny = 1 - (e.clientY - rect.top) / rect.height
      // быстрое движение «размешивает» сильнее
      mouse.stir = Math.min(1, mouse.stir + Math.hypot(nx - mouse.tx, ny - mouse.ty) * 4)
      mouse.tx = nx
      mouse.ty = ny
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let visible = true
    let raf = 0
    const t0 = performance.now()
    const draw = (now: number) => {
      raf = 0
      const time = (now - t0) / 1000
      mouse.x += (mouse.tx - mouse.x) * 0.05
      mouse.y += (mouse.ty - mouse.y) * 0.05
      mouse.stir *= 0.96
      gl.uniform1f(uTime, reduced ? 12 : time + 12)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.uniform1f(uStir, mouse.stir)
      gl.uniform1f(uIntro, reduced ? 1 : Math.min(1, time / 2.2))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!reduced && visible && !document.hidden) raf = requestAnimationFrame(draw)
    }
    const start = () => {
      if (!raf) raf = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(() => {
      resize()
      start()
    })
    ro.observe(canvas)
    resize()

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting
      if (visible) start()
    })
    io.observe(canvas)
    const onVis = () => !document.hidden && start()
    document.addEventListener('visibilitychange', onVis)
    start()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [reduced])

  return <canvas ref={canvasRef} aria-hidden className={`block h-full w-full data-[fallback=true]:bg-[radial-gradient(60%_60%_at_65%_40%,#2a4424,#0e1410)] ${className}`} />
}
