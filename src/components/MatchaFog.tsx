import { useEffect, useRef } from 'react'
import { useReducedMotionPref } from '../hooks/useMedia'

/**
 * «Туман над чашей матчи» — настоящая симуляция жидкости (stable fluids) на WebGL2.
 *
 * Поле скоростей решается на маленькой сетке: адвекция → вихри → проекция давлением.
 * Плотность тумана переносится этим полем и мягко «залечивается» к процедурному облаку,
 * поэтому курсор не крутит картинку, а действительно расталкивает и закручивает дым,
 * который затем медленно возвращается. При отрисовке — объёмное самозатенение,
 * мелкие волокна, свет от курсора, рассеянный в тумане, и дизеринг против полос.
 */

// ── шейдеры ────────────────────────────────────────────────────────────────

const VERT = `#version 300 es
in vec2 aPos;
uniform vec2 uTexel;
out vec2 vUv, vL, vR, vT, vB;
void main(){
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 o;
`

const NOISE = `
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = ROT * p * 2.03; a *= 0.5; }
  return v;
}
float fbm4(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p = ROT * p * 2.03; a *= 0.5; }
  return v;
}
`

/** вихрь (ротор) скорости */
const CURL = `${HEAD}
uniform sampler2D uVel;
void main(){
  float L = texture(uVel, vL).y, R = texture(uVel, vR).y;
  float T = texture(uVel, vT).x, B = texture(uVel, vB).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`

/** усиление вихрей + слабый «сквозняк», чтобы туман жил и без курсора */
const VORTICITY = `${HEAD}
${NOISE}
uniform sampler2D uVel, uCurl;
uniform float uCurlK, uDt, uTime, uAspect, uAmbient;
void main(){
  float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x, B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f /= length(f) + 1e-4;
  f *= uCurlK * C;
  f.y *= -1.0;
  vec2 q = vUv * vec2(uAspect, 1.0) * 1.7;
  vec2 wind = vec2(noise(q + vec2(0.0, uTime * 0.07)), noise(q + vec2(5.2, 1.3) - uTime * 0.06)) - 0.5;
  vec2 v = texture(uVel, vUv).xy + (f + wind * uAmbient) * uDt;
  o = vec4(clamp(v, -800.0, 800.0), 0.0, 1.0);
}`

/** мазок вдоль отрезка a→b (а не точка) — быстрый жест не рвётся на бусины */
const SPLAT = `${HEAD}
uniform sampler2D uTarget;
uniform vec2 uA, uB;
uniform vec3 uColor;
uniform float uRadius, uAspect, uDrag;
void main(){
  vec2 k = vec2(uAspect, 1.0);
  vec2 pa = vUv * k - uA * k, ba = (uB - uA) * k;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  vec2 d = pa - ba * h;
  float g = exp(-dot(d, d) / uRadius);
  vec3 b = texture(uTarget, vUv).xyz;
  // uDrag > 0: среда увлекается к скорости руки (как ладонь в дыму), иначе — просто добавка
  o = vec4(uDrag > 0.0 ? b + (uColor - b) * g * uDrag : b + uColor * g, 1.0);
}`

const DIVERGENCE = `${HEAD}
uniform sampler2D uVel;
void main(){
  float L = texture(uVel, vL).x, R = texture(uVel, vR).x;
  float T = texture(uVel, vT).y, B = texture(uVel, vB).y;
  vec2 C = texture(uVel, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`

const FADE = `${HEAD}
uniform sampler2D uTex;
uniform float uValue;
void main(){ o = uValue * texture(uTex, vUv); }`

const PRESSURE = `${HEAD}
uniform sampler2D uP, uDiv;
void main(){
  float L = texture(uP, vL).x, R = texture(uP, vR).x;
  float T = texture(uP, vT).x, B = texture(uP, vB).x;
  o = vec4(0.25 * (L + R + B + T - texture(uDiv, vUv).x), 0.0, 0.0, 1.0);
}`

const GRADIENT = `${HEAD}
uniform sampler2D uP, uVel;
void main(){
  float L = texture(uP, vL).x, R = texture(uP, vR).x;
  float T = texture(uP, vT).x, B = texture(uP, vB).x;
  o = vec4(texture(uVel, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
}`

const ADVECT_VEL = `${HEAD}
uniform sampler2D uVel;
uniform vec2 uSimTexel;
uniform float uDt, uDiss;
void main(){
  vec2 c = vUv - uDt * texture(uVel, vUv).xy * uSimTexel;
  o = vec4(texture(uVel, c).xy / (1.0 + uDiss * uDt), 0.0, 1.0);
}`

/**
 * Плотность: переносится потоком и тянется к процедурному облаку.
 * r — туман, g — «тепло» от курсора (светящийся след, быстро гаснет).
 */
const ADVECT_DYE = `${HEAD}
${NOISE}
uniform sampler2D uVel, uDye;
uniform vec2 uSimTexel;
uniform float uDt, uRelax, uHeatKeep, uTime, uAspect;
float cloud(vec2 uv, float t){
  vec2 p = uv * vec2(uAspect, 1.0) * 1.35 + vec2(t * 0.022, -t * 0.008);
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.035)), fbm(p + vec2(5.2, 1.3) - t * 0.03));
  vec2 r = vec2(fbm(p + 2.4 * q + vec2(1.7, 9.2) + t * 0.045), fbm(p + 2.4 * q + vec2(8.3, 2.8) - t * 0.04));
  float f = fbm(p + 2.1 * r);
  f = smoothstep(0.34, 0.74, f);
  // клубы плотнее справа (за фото) и снизу; под заголовком слева — прозрачнее, чтобы текст читался
  float shape = 0.8 + 0.2 * smoothstep(0.1, 0.7, length((uv - vec2(0.3, 0.6)) * vec2(1.0, 1.3)));
  return mix(0.2, 1.0, f) * shape;
}
void main(){
  vec2 c = vUv - uDt * texture(uVel, vUv).xy * uSimTexel;
  vec4 d = texture(uDye, c);
  float target = cloud(vUv, uTime);
  d.r = mix(max(d.r, 0.0), target, uRelax);
  d.g = clamp(d.g * uHeatKeep, 0.0, 1.4);
  o = vec4(d.rg, 0.0, 1.0);
}`

const DISPLAY = `${HEAD}
${NOISE}
uniform sampler2D uDye, uVel;
uniform vec2 uMouse, uLightDir;
uniform float uAspect, uTime, uIntro, uLamp;
void main(){
  vec2 uv = vUv;
  vec2 k = vec2(uAspect, 1.0);
  vec4 d = texture(uDye, uv);
  vec2 vel = texture(uVel, uv).xy;
  float jitter = hash(gl_FragCoord.xy + fract(uTime * 7.31) * 91.7);

  // мелкие волокна: шум, вытянутый вдоль течения — края облака рвутся на пряди
  vec2 dp = uv * k * 5.0 - vel * 0.0035 + vec2(uTime * 0.04, uTime * 0.012);
  float wisps = fbm4(dp + 1.6 * fbm4(dp * 0.55 - uTime * 0.025));
  float dens = d.r * (0.45 + 1.1 * wisps);
  dens = smoothstep(0.08, 0.8, dens);

  // объём: сколько тумана между точкой и источником света (сверху справа)
  float shadow = 0.0;
  for (int i = 1; i <= 6; i++){
    shadow += texture(uDye, uv + uLightDir * (float(i) - jitter)).r;
  }
  float trans = exp(-shadow * 0.3);
  // контровой свет: край клуба, обращённый к свету, вспыхивает — даёт форму и объём
  float rim = clamp((d.r - texture(uDye, uv + uLightDir * 1.5).r) * 3.5, 0.0, 1.0);

  vec3 ink    = vec3(0.055, 0.078, 0.063);
  vec3 deep   = vec3(0.105, 0.170, 0.095);
  vec3 matcha = vec3(0.373, 0.541, 0.306);
  vec3 glow   = vec3(0.659, 0.776, 0.525);
  vec3 butter = vec3(0.922, 0.796, 0.510);

  // рассеяние: туман светится сам — рассеянный «небесный» свет + прямой свет, ослабленный толщей
  vec3 scatter = dens * (deep * 0.9 + matcha * trans * 0.6) + glow * rim * dens * 0.35;
  vec3 col = ink * (1.0 - dens * 0.3) + scatter;

  // далёкий источник: мягкое сияние сверху справа, сильнее там, где есть туман
  float sun = exp(-length((uv - vec2(0.92, 1.1)) * k) * 1.4);
  col += glow * sun * (0.035 + 0.18 * dens * trans);

  // курсор — фонарь в тумане: свет рассеивается пропорционально плотности
  vec2 m = (uv - uMouse) * k;
  float md = dot(m, m);
  float lamp = exp(-md * 7.0) * uLamp;
  vec3 lampCol = mix(glow, butter, 0.5);
  col += lampCol * lamp * (0.035 + dens * 0.42);
  col += lampCol * exp(-md * 45.0) * uLamp * (0.02 + dens * 0.16);

  // тёплый светящийся след размешивания
  col += mix(glow, butter, 0.35) * d.g * (0.05 + dens * 0.5);

  float vig = smoothstep(1.3, 0.2, length((uv - vec2(0.5, 0.58)) * vec2(1.0, 1.2)));
  col = mix(ink, col, vig);
  col = mix(col, ink, smoothstep(0.35, 0.0, uv.y));
  col = mix(ink, col, uIntro);
  // дизеринг: тёмные градиенты не распадаются на ступеньки
  col += (jitter - 0.5) / 255.0 * 1.5;
  o = vec4(col, 1.0);
}`

// ── обвязка WebGL ──────────────────────────────────────────────────────────

type Prog = { bind: () => void; u: (name: string) => WebGLUniformLocation | null }
type FBO = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number }
type Double = { read: FBO; write: FBO; swap: () => void }

function makeProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fsSrc: string): Prog | null {
  const fs = gl.createShader(gl.FRAGMENT_SHADER)
  const p = gl.createProgram()
  if (!fs || !p) return null
  gl.shaderSource(fs, fsSrc)
  gl.compileShader(fs)
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  gl.bindAttribLocation(p, 0, 'aPos')
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    if (import.meta.env.DEV) console.warn(gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(p))
    return null
  }
  const cache = new Map<string, WebGLUniformLocation | null>()
  return {
    bind: () => gl.useProgram(p),
    u: (name) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name))
      return cache.get(name) ?? null
    },
  }
}

function makeFBO(gl: WebGL2RenderingContext, w: number, h: number): FBO {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
  const fb = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  gl.viewport(0, 0, w, h)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  return { tex, fb, w, h }
}

function makeDouble(gl: WebGL2RenderingContext, w: number, h: number): Double {
  const d = {
    read: makeFBO(gl, w, h),
    write: makeFBO(gl, w, h),
    swap: () => {
      const t = d.read
      d.read = d.write
      d.write = t
    },
  }
  return d
}

function freeFBO(gl: WebGL2RenderingContext, f: FBO) {
  gl.deleteTexture(f.tex)
  gl.deleteFramebuffer(f.fb)
}

/** размер сетки по короткой стороне, длинная — по пропорции кадра */
function gridSize(base: number, aspect: number) {
  const long = Math.round(base * Math.max(aspect, 1 / aspect))
  return aspect >= 1 ? { w: long, h: base } : { w: base, h: long }
}

// ── параметры «физики» ─────────────────────────────────────────────────────

const SIM_RES = 128
const DYE_RES = 320
const PRESSURE_ITERS = 20
const VEL_DISSIPATION = 0.9
const CURL_STRENGTH = 22
const AMBIENT = 130
const RELAX = 0.26 // скорость, с которой туман «залечивается», 1/с
const HEAT_FADE = 1.1
const SPLAT_RADIUS = 0.0045
const DISPLAY_SCALE = 0.6
const MAX_DISPLAY_W = 1400

export function MatchaFog({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotionPref()

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    // свой canvas на каждый запуск эффекта: после loseContext() старый холст уже не оживить
    // (иначе StrictMode и HMR оставляют вместо тумана заглушку)
    const canvas = document.createElement('canvas')
    canvas.className = 'block h-full w-full'
    host.appendChild(canvas)
    const fail = () => {
      host.dataset.fallback = 'true'
      canvas.remove()
    }
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' })
    // рендер в half-float нужен для симуляции; без него — статичный градиент из CSS
    if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) {
      fail()
      return
    }
    delete host.dataset.fallback

    const vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, VERT)
    gl.compileShader(vs)
    const P = {
      curl: makeProgram(gl, vs, CURL),
      vort: makeProgram(gl, vs, VORTICITY),
      splat: makeProgram(gl, vs, SPLAT),
      div: makeProgram(gl, vs, DIVERGENCE),
      fade: makeProgram(gl, vs, FADE),
      pressure: makeProgram(gl, vs, PRESSURE),
      grad: makeProgram(gl, vs, GRADIENT),
      advVel: makeProgram(gl, vs, ADVECT_VEL),
      advDye: makeProgram(gl, vs, ADVECT_DYE),
      display: makeProgram(gl, vs, DISPLAY),
    }
    if (Object.values(P).some((p) => !p)) {
      fail()
      return
    }
    const prog = P as { [K in keyof typeof P]: Prog }

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.disable(gl.BLEND)

    const draw = (target: FBO | null, texel: [number, number], p: Prog) => {
      gl.uniform2f(p.u('uTexel'), texel[0], texel[1])
      if (target) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb)
        gl.viewport(0, 0, target.w, target.h)
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    let unit = 0
    const tex = (p: Prog, name: string, f: FBO) => {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, f.tex)
      gl.uniform1i(p.u(name), unit++)
    }
    const use = (p: Prog) => {
      p.bind()
      unit = 0
    }

    // ── буферы ──
    let aspect = 1
    let vel: Double, dye: Double, pres: Double, divF: FBO, curlF: FBO
    let simTexel: [number, number] = [1, 1]
    let dyeTexel: [number, number] = [1, 1]
    let allocated = false
    const free = () => {
      if (!allocated) return
      ;[vel.read, vel.write, dye.read, dye.write, pres.read, pres.write, divF, curlF].forEach((f) => freeFBO(gl, f))
    }
    const allocate = () => {
      free()
      const s = gridSize(SIM_RES, aspect)
      const d = gridSize(DYE_RES, aspect)
      vel = makeDouble(gl, s.w, s.h)
      pres = makeDouble(gl, s.w, s.h)
      divF = makeFBO(gl, s.w, s.h)
      curlF = makeFBO(gl, s.w, s.h)
      dye = makeDouble(gl, d.w, d.h)
      simTexel = [1 / s.w, 1 / s.h]
      dyeTexel = [1 / d.w, 1 / d.h]
      allocated = true
      stepDye(0, 1) // сразу заполняем облаком, без чёрного кадра
    }

    // ── шаги симуляции ──
    let time = 12
    const splat = (target: Double, texel: [number, number], a: [number, number], b: [number, number], color: [number, number, number], radius: number, drag = 0) => {
      const p = prog.splat
      use(p)
      tex(p, 'uTarget', target.read)
      gl.uniform2f(p.u('uA'), a[0], a[1])
      gl.uniform2f(p.u('uB'), b[0], b[1])
      gl.uniform3f(p.u('uColor'), color[0], color[1], color[2])
      gl.uniform1f(p.u('uRadius'), radius)
      gl.uniform1f(p.u('uAspect'), aspect)
      gl.uniform1f(p.u('uDrag'), drag)
      draw(target.write, texel, p)
      target.swap()
    }

    const stepDye = (dt: number, relax: number) => {
      const p = prog.advDye
      use(p)
      tex(p, 'uVel', vel.read)
      tex(p, 'uDye', dye.read)
      gl.uniform2f(p.u('uSimTexel'), simTexel[0], simTexel[1])
      gl.uniform1f(p.u('uDt'), dt)
      gl.uniform1f(p.u('uRelax'), relax)
      gl.uniform1f(p.u('uHeatKeep'), Math.exp(-HEAT_FADE * dt))
      gl.uniform1f(p.u('uTime'), time)
      gl.uniform1f(p.u('uAspect'), aspect)
      draw(dye.write, dyeTexel, p)
      dye.swap()
    }

    const stepVelocity = (dt: number) => {
      let p = prog.curl
      use(p)
      tex(p, 'uVel', vel.read)
      draw(curlF, simTexel, p)

      p = prog.vort
      use(p)
      tex(p, 'uVel', vel.read)
      tex(p, 'uCurl', curlF)
      gl.uniform1f(p.u('uCurlK'), CURL_STRENGTH)
      gl.uniform1f(p.u('uDt'), dt)
      gl.uniform1f(p.u('uTime'), time)
      gl.uniform1f(p.u('uAspect'), aspect)
      gl.uniform1f(p.u('uAmbient'), AMBIENT)
      draw(vel.write, simTexel, p)
      vel.swap()
    }

    const project = (dt: number) => {
      let p = prog.div
      use(p)
      tex(p, 'uVel', vel.read)
      draw(divF, simTexel, p)

      p = prog.fade
      use(p)
      tex(p, 'uTex', pres.read)
      gl.uniform1f(p.u('uValue'), 0.8)
      draw(pres.write, simTexel, p)
      pres.swap()

      p = prog.pressure
      for (let i = 0; i < PRESSURE_ITERS; i++) {
        use(p)
        tex(p, 'uP', pres.read)
        tex(p, 'uDiv', divF)
        draw(pres.write, simTexel, p)
        pres.swap()
      }

      p = prog.grad
      use(p)
      tex(p, 'uP', pres.read)
      tex(p, 'uVel', vel.read)
      draw(vel.write, simTexel, p)
      vel.swap()

      p = prog.advVel
      use(p)
      tex(p, 'uVel', vel.read)
      gl.uniform2f(p.u('uSimTexel'), simTexel[0], simTexel[1])
      gl.uniform1f(p.u('uDt'), dt)
      gl.uniform1f(p.u('uDiss'), VEL_DISSIPATION)
      draw(vel.write, simTexel, p)
      vel.swap()
    }

    const render = (intro: number) => {
      const p = prog.display
      use(p)
      tex(p, 'uDye', dye.read)
      tex(p, 'uVel', vel.read)
      gl.uniform1f(p.u('uAspect'), aspect)
      gl.uniform1f(p.u('uTime'), time)
      gl.uniform1f(p.u('uIntro'), intro)
      gl.uniform2f(p.u('uMouse'), ptr.sx, ptr.sy)
      gl.uniform1f(p.u('uLamp'), ptr.lamp)
      // шаг луча к свету с учётом пропорций кадра
      gl.uniform2f(p.u('uLightDir'), (0.55 * 0.02) / aspect, 0.85 * 0.02)
      draw(null, [1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight], p)
    }

    // ── размер ──
    const resize = () => {
      const w = Math.max(1, canvas.clientWidth)
      const h = Math.max(1, canvas.clientHeight)
      const scale = Math.min(DISPLAY_SCALE * Math.min(window.devicePixelRatio || 1, 2), MAX_DISPLAY_W / w)
      canvas.width = Math.max(1, Math.round(w * scale))
      canvas.height = Math.max(1, Math.round(h * scale))
      const next = w / h
      const s = gridSize(SIM_RES, next)
      if (!allocated || s.w !== vel.read.w || s.h !== vel.read.h) {
        aspect = next
        allocate()
      }
      aspect = next
    }

    // ── курсор ──
    // x, y — сырые координаты; sx, sy — сглаженные (из них строятся мазки, поэтому без рывков)
    const ptr = { x: 0.6, y: 0.5, sx: 0.6, sy: 0.5, inside: false, fresh: true, lamp: 0 }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = 1 - (e.clientY - r.top) / r.height
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1
      if (inside && (ptr.fresh || !ptr.inside)) {
        ptr.sx = x
        ptr.sy = y
        ptr.fresh = false
      }
      ptr.x = x
      ptr.y = y
      ptr.inside = inside
    }
    const onLeave = () => {
      ptr.inside = false
    }
    // палец оторвался — «фонарь» гаснет
    const onUp = (e: PointerEvent) => e.pointerType !== 'mouse' && onLeave()
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)

    // мазок курсора: импульс в скорость + тепло и лёгкое «раздвигание» плотности
    const stir = (a: [number, number], b: [number, number], dt: number, power: number, radius: number, marks = true) => {
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      let vx = dx / dt
      let vy = dy / dt
      const speed = Math.hypot(vx * aspect, vy)
      if (speed < 1e-4) return
      const cap = Math.min(1, 3 / speed)
      vx *= cap
      vy *= cap
      // скорость в «клетках сетки в секунду»
      splat(vel, simTexel, a, b, [(vx * power) / simTexel[0], (vy * power) / simTexel[1], 0], radius, 0.55)
      // тепло и «раздвигание» пропорциональны пройденному пути: медленный жест не копит лишнего
      const amount = Math.hypot(dx * aspect, dy) * Math.min(speed, 2) * power
      if (marks) splat(dye, dyeTexel, a, b, [-amount * 0.7, amount * 3, 0], radius * 0.8)
    }

    // ── цикл ──
    let visible = true
    let raf = 0
    let last = 0
    let started = 0
    let wasInside = false
    let lastScroll = window.scrollY
    const prevS: [number, number] = [ptr.sx, ptr.sy]
    const prevIntro: [number, number] = [-0.15, 0.5]

    const introPath = (t: number): [number, number] => {
      const k = Math.min(1, Math.max(0, (t - 0.2) / 2.6))
      const e = 1 - (1 - k) ** 3
      return [-0.15 + e * 1.3, 0.5 + 0.13 * Math.sin(e * 5.2)]
    }
    // фигуры Лиссажу с разными периодами — траектории не повторяются на глаз
    const draftPath = (t: number, i: number): [number, number] =>
      i === 0
        ? [0.62 + 0.3 * Math.sin(t * 0.13 + 1.0), 0.5 + 0.32 * Math.sin(t * 0.19)]
        : [0.4 + 0.34 * Math.cos(t * 0.11 + 2.0), 0.48 + 0.3 * Math.sin(t * 0.17 + 4.0)]
    const drafts: [number, number][] = [draftPath(time, 0), draftPath(time, 1)]

    const frame = (now: number) => {
      raf = 0
      if (!started) started = now
      const dt = Math.min(1 / 30, last ? (now - last) / 1000 : 1 / 60)
      last = now
      const age = (now - started) / 1000
      time += dt

      // сглаживание позиции (критически демпфированное), «фонарь» плавно зажигается
      const a = 1 - Math.exp(-dt * 22)
      ptr.sx += (ptr.x - ptr.sx) * a
      ptr.sy += (ptr.y - ptr.sy) * a
      ptr.lamp += ((ptr.inside ? 1 : 0) - ptr.lamp) * (1 - Math.exp(-dt * 3))

      stepVelocity(dt)
      // вступление: невидимая рука один раз проводит по туману слева направо
      if (age < 3.2) {
        const p = introPath(age)
        stir(prevIntro, p, dt, 0.55, SPLAT_RADIUS * 3, false)
        prevIntro[0] = p[0]
        prevIntro[1] = p[1]
      }
      // прокрутка тянет туман вверх широким потоком — экран будто уходит сквозь дым
      const sy = window.scrollY
      const ds = sy - lastScroll
      lastScroll = sy
      if (ds !== 0) {
        const vy = Math.max(-2, Math.min(2, ds / Math.max(1, canvas.clientHeight) / dt))
        splat(vel, simTexel, [-0.1, 0.25], [1.1, 0.25], [0, (vy * 0.8) / simTexel[1], 0], SPLAT_RADIUS * 10, 0.25)
      }
      // два невидимых сквозняка медленно бродят по кадру — туман клубится и без курсора
      for (let i = 0; i < drafts.length; i++) {
        const prev = drafts[i]!
        const p = draftPath(time, i)
        stir(prev, p, dt, 6, SPLAT_RADIUS * 5, false)
        prev[0] = p[0]
        prev[1] = p[1]
      }
      // мазок только если курсор был внутри и на прошлом кадре — вход не даёт «прыжка»
      if (ptr.inside && wasInside) stir(prevS, [ptr.sx, ptr.sy], dt, 0.9, SPLAT_RADIUS)
      wasInside = ptr.inside
      prevS[0] = ptr.sx
      prevS[1] = ptr.sy
      project(dt)
      stepDye(dt, 1 - Math.exp(-RELAX * dt))
      render(Math.min(1, age / 2.2) ** 1.5)

      if (visible && !document.hidden) raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (reduced) {
        // статичный кадр: облако без движения
        stepDye(0, 1)
        ptr.lamp = 0
        render(1)
        return
      }
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }

    resize()
    const ro = new ResizeObserver(() => {
      resize()
      if (reduced) start()
    })
    ro.observe(canvas)
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
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      document.removeEventListener('visibilitychange', onVis)
      free()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    }
  }, [reduced])

  return <div ref={hostRef} aria-hidden className={`h-full w-full bg-ink data-[fallback=true]:bg-[radial-gradient(60%_60%_at_65%_40%,#2a4424,#0e1410)] ${className}`} />
}
