import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// A field of particles that starts as a sphere and morphs into a ring as you scroll.

const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const vertexShader = /* glsl */ `
uniform float uTime; uniform float uMorph; uniform float uPixelRatio; uniform vec2 uMouse;
attribute vec3 aTarget; attribute float aRand;
varying float vAlpha; varying float vRand;
${noise}
void main(){
  float m = smoothstep(0.0, 1.0, clamp(uMorph * (0.75 + aRand * 0.5), 0.0, 1.0));
  vec3 p = mix(position, aTarget, m);
  float n = snoise(p * 0.85 + vec3(uTime * 0.12));
  p += normalize(p + 0.0001) * n * (0.22 - 0.1 * m);
  p.xy += uMouse * 0.12 * (0.4 + aRand);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (2.0 + aRand * 2.8) * uPixelRatio * (7.0 / -mv.z);
  vAlpha = 0.25 + 0.75 * smoothstep(-0.4, 0.7, n);
  vRand = aRand;
}`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorA; uniform vec3 uColorB; uniform float uOpacity;
varying float vAlpha; varying float vRand;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d);
  vec3 c = mix(uColorB, uColorA, step(0.72, vRand));
  gl_FragColor = vec4(c, a * vAlpha * uOpacity * 0.85);
}`;

function buildGeometry(count: number) {
  const pos = new Float32Array(count * 3);
  const tgt = new Float32Array(count * 3);
  const rnd = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const R = 1.55;
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pos[i * 3] = Math.cos(th) * r * R;
    pos[i * 3 + 1] = y * R;
    pos[i * 3 + 2] = Math.sin(th) * r * R;

    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const ring = 2.1;
    const tube = 0.18 + Math.random() * 0.28;
    tgt[i * 3] = (ring + tube * Math.cos(v)) * Math.cos(u);
    tgt[i * 3 + 1] = tube * Math.sin(v);
    tgt[i * 3 + 2] = (ring + tube * Math.cos(v)) * Math.sin(u);
    rnd[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aTarget", new THREE.BufferAttribute(tgt, 3));
  g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
  return g;
}

const lerp = THREE.MathUtils.lerp;
const ease = (x: number, a: number, b: number) => THREE.MathUtils.smoothstep(x, a, b);

function Field({ count, reduced }: { count: number; reduced: boolean }) {
  const ref = useRef<THREE.Points>(null!);
  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const { size } = useThree();
  const geometry = useMemo(() => buildGeometry(count), [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uOpacity: { value: 1 },
          uMouse: { value: new THREE.Vector2() },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.25) },
          uColorA: { value: new THREE.Color("#c8ff2e") },
          uColorB: { value: new THREE.Color("#e9e5dc") },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = window.scrollY / window.innerHeight;
    const u = material.uniforms;
    const m = mouse.current;
    m.x += (m.tx - m.x) * 0.05;
    m.y += (m.ty - m.y) * 0.05;

    u.uTime.value += dt * (reduced ? 0.25 : 1);
    u.uMorph.value += (ease(s, 0.1, 1.1) - u.uMorph.value) * 0.08;
    u.uOpacity.value = 1 - ease(s, 0.8, 1.7);
    u.uMouse.value.set(m.x, m.y);

    const morph = u.uMorph.value;
    const wide = size.width > 900;
    const g = ref.current;
    g.rotation.y += dt * (reduced ? 0.02 : 0.07);
    g.rotation.x = lerp(0.15, 1.05, morph) + m.y * 0.12;
    g.rotation.z = lerp(0, 0.25, morph) + m.x * 0.05;
    g.position.x = lerp(wide ? 1.9 : 0, 0, morph);
    g.position.y = lerp(wide ? 0 : 0.9, 0, morph);
    g.scale.setScalar((wide ? 1 : 0.78) * lerp(1, 1.15, morph));
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

// Renders at most 30 frames per second, only while the hero area is on screen and the tab is visible.
// Once you scroll past it, the scene fades out and stops drawing entirely.
function Driver() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let id = 0;
    let last = 0;
    let wasVisible = true;
    const tick = (t: number) => {
      id = requestAnimationFrame(tick);
      if (document.hidden) return;
      const visible = window.scrollY < window.innerHeight * 1.8;
      if (visible && t - last >= 33) {
        last = t;
        invalidate();
      } else if (!visible && wasVisible) {
        invalidate(); // one last frame so the faded-out state is what stays on screen
      }
      wasVisible = visible;
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [invalidate]);
  return null;
}

export default function Scene() {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowPower = typeof navigator !== "undefined" && (navigator.hardwareConcurrency || 8) <= 4;
  const count = typeof window !== "undefined" && window.innerWidth < 700 ? 2000 : lowPower ? 3000 : 4500;
  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.25]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <Driver />
        <Field count={count} reduced={reduced} />
      </Canvas>
    </div>
  );
}
