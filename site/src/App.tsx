import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, MouseEvent, PointerEvent, ReactNode } from "react";
import Lenis from "lenis";
import { about, archive, building, education, experience, featured, profile, skills, stats } from "./content";

const Scene = lazy(() => import("./Scene"));

const NAV: [string, string][] = [
  ["about", "About"],
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["skills", "Skills"],
  ["contact", "Contact"],
];

function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    lenisRef.current = lenis;
    let id = 0;
    const raf = (t: number) => {
      lenis.raf(t);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);
  return lenisRef;
}

function useReveal() {
  useEffect(() => {
    // Reveal each block once its top enters the lower part of the screen. Anything already scrolled past
    // (for example after clicking a nav link) is revealed too, so content can never stay hidden.
    let pending = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    let queued = false;
    const check = () => {
      queued = false;
      const limit = (window.innerHeight || document.documentElement.clientHeight) * 0.92;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add("is-in");
          return false;
        }
        return true;
      });
    };
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(check);
      }
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
}

function useScrollState() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--progress", String(max > 0 ? window.scrollY / max : 0));
      setScrolled(window.scrollY > 40);
      let current = "";
      for (const [id] of NAV) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return { active, scrolled };
}

function SectionHead({ index, label, title }: { index: string; label: string; title: string }) {
  return (
    <div className="section-head" data-reveal>
      <span className="mono">
        {index} / {label}
      </span>
      <h2>{title}</h2>
    </div>
  );
}

function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };
  return (
    <article ref={ref} className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </article>
  );
}

type FormState = "idle" | "sending" | "sent" | "error";

function ContactForm() {
  const started = useRef(Date.now());
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          message: fd.get("message"),
          company: fd.get("company"),
          elapsed: Date.now() - started.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "send failed");
      form.reset();
      setState("sent");
    } catch (err) {
      const msg = err instanceof Error && err.message !== "send failed" && !err.message.includes("fetch") ? err.message : "";
      setError(msg || `Something went wrong. You can email me directly at ${profile.email}.`);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="form-done" role="status">
        <span className="mono">Message sent</span>
        <p>Thanks for reaching out. I'll reply to the email you gave within a day or two.</p>
        <button className="btn btn-ghost" onClick={() => setState("idle")}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate={false}>
      <div className="hp" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="field">
        <input id="name" name="name" required maxLength={100} placeholder=" " autoComplete="name" />
        <label htmlFor="name">Your name</label>
      </div>
      <div className="field">
        <input id="email" name="email" type="email" required maxLength={254} placeholder=" " autoComplete="email" />
        <label htmlFor="email">Email address</label>
      </div>
      <div className="field">
        <textarea id="message" name="message" required minLength={10} maxLength={5000} rows={5} placeholder=" " />
        <label htmlFor="message">What would you like to talk about?</label>
      </div>
      {state === "error" && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary btn-wide" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending..." : "Send message"}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}

export default function App() {
  const lenis = useSmoothScroll();
  const { active, scrolled } = useScrollState();
  const [menuOpen, setMenuOpen] = useState(false);
  useReveal();

  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis.current) lenis.current.scrollTo(el, { offset: id === "top" ? 0 : -72, duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  const allSkills = skills.flatMap((s) => s.items);

  return (
    <>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>

      <header className={`nav ${scrolled ? "is-scrolled" : ""} ${menuOpen ? "is-open" : ""}`}>
        <div className="wrap nav-inner">
          <a href="#top" className="logo" onClick={go("top")}>
            PK<span>.</span>
          </a>
          <nav aria-label="Sections">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={go(id)} className={active === id ? "is-active" : ""}>
                {label}
              </a>
            ))}
          </nav>
          <a href="#contact" className="btn btn-small" onClick={go("contact")}>
            Let's talk
          </a>
          <button className="menu-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <span />
            <span />
          </button>
        </div>
        <div className="progress" />
      </header>

      <main>
        <section id="top" className="hero">
          <div className="wrap hero-inner">
            <p className="eyebrow hero-in" style={{ "--d": "0.1s" } as CSSProperties}>
              <span className="pulse" /> {profile.status}
            </p>
            <h1 className="hero-title">
              <span className="line">
                <span className="hero-in" style={{ "--d": "0.2s" } as CSSProperties}>
                  {profile.firstName}
                </span>
              </span>
              <span className="line">
                <em className="hero-in" style={{ "--d": "0.32s" } as CSSProperties}>
                  {profile.lastName}
                </em>
              </span>
            </h1>
            <p className="hero-role hero-in" style={{ "--d": "0.5s" } as CSSProperties}>
              {profile.role} <span className="sep">/</span> <span className="accent">{profile.focus}</span>
            </p>
            <p className="hero-intro hero-in" style={{ "--d": "0.62s" } as CSSProperties}>
              {profile.intro}
            </p>
            <div className="cta hero-in" style={{ "--d": "0.74s" } as CSSProperties}>
              <a href="#projects" className="btn btn-primary" onClick={go("projects")}>
                See my work <span aria-hidden="true">→</span>
              </a>
              <a href="#contact" className="btn btn-ghost" onClick={go("contact")}>
                Get in touch
              </a>
            </div>
          </div>
          <div className="wrap hero-foot">
            <span className="mono">{profile.location}</span>
            <span className="scroll-cue mono">
              Scroll <i />
            </span>
          </div>
        </section>

        <section id="about" className="section">
          <div className="wrap">
            <SectionHead index="01" label="About" title="Engineer for the parts that have to work" />
            <div className="about-grid">
              <p className="statement" data-reveal>
                {about.statement}
              </p>
              <div className="about-body" data-reveal>
                {about.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
            <div className="stats">
              {stats.map((s, i) => (
                <div className="stat" key={s.label} data-reveal style={{ "--d": `${i * 0.08}s` } as CSSProperties}>
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" className="section">
          <div className="wrap">
            <SectionHead index="02" label="Experience" title="Where I've been shipping" />
            <div className="jobs">
              {experience.map((job) => (
                <div className="job" key={job.company} data-reveal>
                  <div className="job-meta">
                    <span className="mono">{job.period}</span>
                    <h3>{job.company}</h3>
                    <span className="muted">{job.org}</span>
                  </div>
                  <div className="job-body">
                    <p className="job-role">{job.role}</p>
                    <ul>
                      {job.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                    <div className="chips">
                      {job.stack.map((t) => (
                        <span className="chip" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="section">
          <div className="wrap">
            <SectionHead index="03" label="Projects" title="Selected work" />
            <div className="featured">
              {featured.map((p, i) => (
                <div key={p.title} data-reveal style={{ "--d": `${(i % 2) * 0.1}s` } as CSSProperties}>
                  <TiltCard className="project">
                    <div className="project-top">
                      <span className="mono">
                        {String(i + 1).padStart(2, "0")} / {p.category}
                      </span>
                      <span className="mono">{p.badge ? <b className="badge">{p.badge}</b> : p.year}</span>
                    </div>
                    <h3>{p.title}</h3>
                    <p className="project-summary">{p.summary}</p>
                    <ul>
                      {p.points.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                    <div className="chips">
                      {p.stack.map((t) => (
                        <span className="chip" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </TiltCard>
                </div>
              ))}
            </div>

            <div className="archive" data-reveal>
              <h3 className="sub mono">More projects</h3>
              {archive.map((a) => (
                <div className="archive-row" key={a.title}>
                  <span className="mono">{a.year}</span>
                  <span className="archive-title">{a.title}</span>
                  <span className="archive-note">{a.note}</span>
                  <span className="archive-stack mono">{a.stack}</span>
                </div>
              ))}
            </div>

            <div className="building" data-reveal>
              <div className="building-head">
                <span className="pulse" />
                <h3 className="sub mono">Currently building</h3>
              </div>
              <div className="building-grid">
                {building.map((b) => (
                  <div className="build-card" key={b.title}>
                    <h4>{b.title}</h4>
                    <p>{b.note}</p>
                    <span className="mono build-stack">{b.stack.join("  ·  ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="skills" className="section">
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {[...allSkills, ...allSkills].map((s, i) => (
                <span key={i}>
                  {s}
                  <i>✦</i>
                </span>
              ))}
            </div>
          </div>
          <div className="wrap">
            <SectionHead index="04" label="Toolkit" title="What I work with" />
            <div className="skills">
              {skills.map((g, i) => (
                <div className="skill-group" key={g.group} data-reveal style={{ "--d": `${i * 0.06}s` } as CSSProperties}>
                  <h3 className="mono">{g.group}</h3>
                  <ul>
                    {g.items.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="edu">
              <h3 className="sub mono" data-reveal>
                Education and research
              </h3>
              {education.map((e) => (
                <div className="edu-row" key={e.school} data-reveal>
                  <span className="mono">{e.period}</span>
                  <div>
                    <h4>{e.degree}</h4>
                    <p className="muted">{e.school}</p>
                  </div>
                  <p className="edu-detail">{e.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="section contact">
          <div className="wrap">
            <div className="contact-grid">
            <div data-reveal>
              <span className="mono">05 / Contact</span>
              <h2 className="contact-title">
                Let's build something <em>useful.</em>
              </h2>
              <p className="muted contact-copy">
                Hiring, collaborating, or just curious about something I built? Send a note and it lands straight in my
                inbox.
              </p>
              <div className="contact-links">
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
                <a href={profile.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn ↗
                </a>
                <a href={profile.github} target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
              </div>
            </div>
            <div data-reveal style={{ "--d": "0.1s" } as CSSProperties}>
              <ContactForm />
            </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <span className="muted">Built with React, Three.js, and AWS</span>
          <a href="#top" onClick={go("top")}>
            Back to top ↑
          </a>
        </div>
      </footer>
    </>
  );
}
