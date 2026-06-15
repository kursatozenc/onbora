'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Design data ──────────────────────────────────────────────────────────────

const OCP_SECTIONS = [
  {
    ix: '01', t: 'Direction',
    rows: [
      { kind: 'line' as const, v: <><b>North star —</b> make money movement boringly reliable.</> },
      { kind: 'kv' as const, k: 'targets', v: '99.99% settlement accuracy · p99 < 200ms' },
    ],
  },
  {
    ix: '02', t: 'Roles & ownership',
    rows: [
      { kind: 'kv' as const, k: 'tech lead', v: 'Priya N.' },
      { kind: 'kv' as const, k: 'product', v: 'Marcus L.' },
      { kind: 'kv' as const, k: 'on-call', v: 'weekly rotation' },
    ],
  },
  {
    ix: '03', t: 'Norms',
    rows: [
      { kind: 'line' as const, v: 'Decisions land in writing as an RFC.' },
      { kind: 'line' as const, v: 'Disagree & commit after two rounds.' },
      { kind: 'line' as const, v: 'No meeting without an agenda.' },
    ],
  },
  {
    ix: '04', t: 'Rituals & cadence',
    chips: ['Async standup · #atlas', 'Mon planning', 'Wed design review', 'Fri demo + retro'],
  },
  {
    ix: '05', t: 'Unwritten rules',
    unwritten: [
      'Ship behind a flag — always.',
      'Ping @oncall, never a person.',
      'No deploys after 2pm Friday.',
      '"LGTM" means approved.',
    ],
  },
  {
    ix: '06', t: 'Context & glossary',
    chips: ['Ledger', 'Settlement', 'PSP', 'Idempotency key', 'Sandbox'],
  },
];

const STEPS = [
  {
    n: 'Step 01', icon: 'mic', t: 'Structured interview',
    d: "A guided interview based on Hackman's Team Design model surfaces how your team actually operates — direction, roles, norms, the unwritten rules.",
  },
  {
    n: 'Step 02', icon: 'file', t: 'Your OCP is generated',
    d: 'Onbora compiles the answers into an Onboarding Context Profile: a structured, living document with consistent Team OS sections.',
  },
  {
    n: 'Step 03', icon: 'deliver', t: 'Delivered anywhere',
    d: "Read it on the web, receive it in Slack, or inject it straight into an AI agent's system prompt through the API.",
  },
];

// ─── Toy-block palette (maps to CSS vars on .dir-h) ─────────────────────────────

const PL = {
  amber: 'var(--pl-amber)', coral: 'var(--pl-coral)', teal: 'var(--pl-teal)',
  blue: 'var(--pl-blue)', mustard: 'var(--pl-mustard)', rose: 'var(--pl-rose)', indigo: 'var(--pl-indigo)',
};

type Shape = 'sq' | 'circle' | 'semi';
interface Part { shape: Shape; w: number; h?: number; color: string }
interface Char { kind: 'human' | 'bot'; head: Part; body: Part; face: 'eyes' | 'bot' | 'sleepy' | 'happy' }

// Each "teammate" is a little block creature: a head with a face and a body.
// One of them is the AI — square LED eyes and a coral antenna.
const CHARACTERS: Char[] = [
  { kind: 'human', face: 'happy',  head: { shape: 'circle', w: 46, color: PL.amber },          body: { shape: 'sq', w: 62, h: 74, color: PL.indigo } },
  { kind: 'human', face: 'eyes',   head: { shape: 'semi', w: 66, h: 40, color: PL.teal },      body: { shape: 'sq', w: 64, h: 56, color: PL.coral } },
  { kind: 'bot',   face: 'bot',    head: { shape: 'sq', w: 54, h: 50, color: PL.blue },         body: { shape: 'sq', w: 58, h: 78, color: PL.mustard } },
  { kind: 'human', face: 'happy',  head: { shape: 'circle', w: 50, color: PL.rose },           body: { shape: 'circle', w: 64, color: PL.teal } },
  { kind: 'human', face: 'sleepy', head: { shape: 'semi', w: 60, h: 36, color: PL.mustard },   body: { shape: 'sq', w: 60, h: 66, color: PL.blue } },
];

const H_CARDS = [
  { blocks: [PL.amber, PL.indigo], t: 'Structured, not tribal', d: "The knowledge that runs your team — written down once, in a consistent schema, instead of living in people's heads.", dark: false },
  { blocks: [PL.teal, PL.coral, PL.mustard], t: 'Portable context', d: "Read the OCP on the web, get it in Slack, or inject it into an agent's system prompt. One profile, every surface.", dark: false },
  { blocks: [PL.blue, PL.rose], t: 'Living, never stale', d: 'Update the OCP once and every reader — human or AI — re-syncs to the latest version of how your team works.', dark: true },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function SVG({ children, size = 22 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const Icons: Record<string, React.FC<{ size?: number }>> = {
  mic:      ({ size }) => <SVG size={size}><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><path d="M12 18v3"/></SVG>,
  file:     ({ size }) => <SVG size={size}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></SVG>,
  deliver:  ({ size }) => <SVG size={size}><path d="M3 11l18-8-8 18-2-7-8-3z"/></SVG>,
  arrow:    ({ size }) => <SVG size={size}><path d="M5 12h14M13 6l6 6-6 6"/></SVG>,
  check:    ({ size = 17 }) => <SVG size={size}><path d="M4 12.5l5 5L20 6"/></SVG>,
  star:     ({ size = 14 }) => <SVG size={size}><path d="M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1z"/></SVG>,
  terminal: ({ size }) => <SVG size={size}><path d="M5 7l4 4-4 4M12 17h7"/></SVG>,
  plug:     ({ size }) => <SVG size={size}><path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0z"/><path d="M12 16v5"/></SVG>,
  menu:     ({ size }) => <SVG size={size}><path d="M4 7h16M4 12h16M4 17h16"/></SVG>,
};

// ─── Motion: Reveal ───────────────────────────────────────────────────────────

function Reveal({
  children, delay = 0, y = 20, threshold = 0.18, immediate = false, className = '', style,
}: {
  children: React.ReactNode; delay?: number; y?: number; threshold?: number;
  immediate?: boolean; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let done = false;
    const reveal = () => { if (!done) { done = true; setSeen(true); } };
    const fb = setTimeout(reveal, 2200);

    if (immediate) {
      setArmed(true);
      const t = setTimeout(reveal, delay + 20);
      return () => { clearTimeout(t); clearTimeout(fb); };
    }
    setArmed(true);
    if (!ref.current || !('IntersectionObserver' in window)) { reveal(); return () => clearTimeout(fb); }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setTimeout(reveal, delay); }),
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(ref.current);
    return () => { io.disconnect(); clearTimeout(fb); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref}
      className={`rv ${armed && !seen ? 'rv--armed' : ''} ${seen ? 'rv--in' : ''} ${className}`}
      style={{ ...(y !== 20 ? { '--rv-y': `${y}px` } as React.CSSProperties : {}), ...style }}>
      {children}
    </div>
  );
}

// ─── Wordmark ─────────────────────────────────────────────────────────────────

function Wordmark() {
  return (
    <a className="wordmark" href="/" onClick={(e) => e.preventDefault()} style={{ color: 'var(--ink)' }}>
      <span className="wordmark__mark" style={{ background: 'var(--indigo)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: '1', color: 'var(--ivory)', marginTop: -1, display: 'block' }}>O</span>
        <span style={{ position: 'absolute', right: 6, bottom: 6, width: 4, height: 4, borderRadius: '50%', background: 'var(--amber)' }} />
      </span>
      <span className="wordmark__type">Onbora</span>
    </a>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

function Btn({ variant = 'primary', size, children, icon, href = '#', onClick, style }: {
  variant?: 'primary' | 'ghost' | 'ghost-light' | 'ivory';
  size?: 'sm'; children: React.ReactNode; icon?: string;
  href?: string; onClick?: (e: React.MouseEvent) => void; style?: React.CSSProperties;
}) {
  const IconC = icon ? Icons[icon] : null;
  const cls = `obtn obtn--${variant}${size === 'sm' ? ' obtn--sm' : ''}`;
  const inner = <>{children}{IconC && <IconC size={16} />}</>;

  // Internal route (e.g. /setup, /employee) → real client-side navigation.
  if (href.startsWith('/')) {
    return <Link className={cls} href={href} style={style} onClick={onClick}>{inner}</Link>;
  }
  // In-page anchor (e.g. #ocp) → smooth scroll within the body scroll container.
  if (href.length > 1 && href.startsWith('#')) {
    return (
      <a className={cls} href={href} style={style}
        onClick={(e) => {
          e.preventDefault();
          document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          onClick?.(e);
        }}>
        {inner}
      </a>
    );
  }
  // Placeholder ("#") → no navigation.
  return (
    <a className={cls} href={href} style={style}
      onClick={(e) => { e.preventDefault(); onClick?.(e); }}>
      {inner}
    </a>
  );
}

// ─── Block characters ("teammates") ─────────────────────────────────────────────

function HShape({ shape, w, h, color, children }: Part & { children?: React.ReactNode }) {
  const cls = shape === 'circle' ? 'h-circle' : shape === 'semi' ? 'h-semi' : 'h-sq';
  return (
    <span className={`h-shape ${cls}`} style={{ width: w, height: h ?? w, background: color }}>
      {children}
    </span>
  );
}

function HCharacter({ c, i }: { c: Char; i: number }) {
  // Derive organic, non-synced timing from the index — no two creatures bob alike.
  const bobDur = 3 + ((i * 7) % 5) * 0.3;          // 3.0 – 4.2s
  const bobDelay = (((i * 13) % 10) / 10) * 1.6;   // 0 – 1.6s
  const swayDur = 5.5 + ((i * 11) % 4) * 0.5;      // 5.5 – 7.0s
  const swayDelay = (((i * 5) % 7) / 7) * 1.2;     // 0 – 1.2s
  const blinkDelay = (((i * 17) % 11) / 10) * 4;   // 0 – 4.0s

  const style = {
    '--bob-dur': `${bobDur}s`, '--bob-delay': `${bobDelay}s`,
    '--sway-dur': `${swayDur}s`, '--sway-delay': `${swayDelay}s`,
    '--blink-delay': `${blinkDelay}s`,
  } as React.CSSProperties;

  const eyeCls = `h-eye${c.face === 'sleepy' ? ' h-eye--line' : ''}`;

  return (
    <div className="h-fig" data-kind={c.kind} style={style}>
      <div className="h-fig__sway">
        <div className="h-fig__inner">
          {c.kind === 'bot' && <span className="h-antenna" />}
          <HShape {...c.head}>
            <span className="h-face"><span className={eyeCls} /><span className={eyeCls} /></span>
            {c.face === 'happy' && <span className="h-mouth" />}
          </HShape>
          <HShape {...c.body} />
        </div>
      </div>
      <div className="h-fig__shadow" />
    </div>
  );
}

function HFigRow({ chars }: { chars: Char[] }) {
  return (
    <div className="h-figrow">
      {chars.map((c, i) => <HCharacter key={i} c={c} i={i} />)}
    </div>
  );
}

// ─── OCP Document ─────────────────────────────────────────────────────────────

function OCPSection({ s }: { s: typeof OCP_SECTIONS[0] }) {
  return (
    <div className="ocp-sec">
      <div className="ocp-sec__h">
        <span className="ocp-sec__ix">{s.ix}</span>
        <span className="ocp-sec__t">{s.t}</span>
        <span className="ocp-sec__line" />
      </div>
      {'rows' in s && s.rows?.map((r, i) =>
        r.kind === 'kv'
          ? <div className="ocp-row ocp-kv" key={i}><span className="ocp-kv__k">{r.k}</span><span className="ocp-kv__v">{r.v}</span></div>
          : <div className="ocp-row" key={i}>{r.v}</div>
      )}
      {'chips' in s && s.chips && (
        <div style={{ marginTop: 2 }}>{s.chips.map((c, i) => <span className="ocp-chip" key={i}>{c}</span>)}</div>
      )}
      {'unwritten' in s && s.unwritten?.map((u, i) => (
        <div className="ocp-unwritten" key={i}>
          <span className="ocp-unwritten__star"><Icons.star size={14} /></span>
          <span className="ocp-row">{u}</span>
        </div>
      ))}
    </div>
  );
}

function PromptView() {
  const C = ({ c, children }: { c: string; children: React.ReactNode }) => <span className={c}>{children}</span>;
  return (
    <div className="ocp-prompt">
<C c="pc"># OPERATING CONTEXT — Atlas · Payments Platform{'\n'}# source: Onbora OCP · schema v1.2 · living</C>{'\n\n'}<C c="pk">direction</C><C c="pp">:</C>{'\n'}  <C c="pk">north_star</C><C c="pp">:</C> <C c="ps">&quot;money movement, boringly reliable&quot;</C>{'\n'}  <C c="pk">targets</C><C c="pp">:</C> <C c="ps">[&quot;99.99% settlement&quot;, &quot;p99 &lt; 200ms&quot;]</C>{'\n\n'}<C c="pk">roles</C><C c="pp">:</C>{'\n'}  <C c="pk">tech_lead</C><C c="pp">:</C> <C c="ps">&quot;Priya N.&quot;</C>{'\n'}  <C c="pk">on_call</C><C c="pp">:</C> <C c="ps">&quot;ping @oncall, not a person&quot;</C>{'\n\n'}<C c="pk">norms</C><C c="pp">:</C>{'\n'}  <C c="pp">-</C> <C c="ps">&quot;decisions land in writing (RFC)&quot;</C>{'\n'}  <C c="pp">-</C> <C c="ps">&quot;disagree &amp; commit after two rounds&quot;</C>{'\n\n'}<C c="pk">unwritten</C><C c="pp">:</C>{'\n'}  <C c="pp">-</C> <C c="ps">&quot;ship behind a flag, always&quot;</C>{'\n'}  <C c="pp">-</C> <C c="ps">&quot;no deploys after 2pm Friday&quot;</C>
    </div>
  );
}

function OCPDoc({ mode: modeProp, onMode, animated = false, live = true }: {
  mode?: 'doc' | 'prompt'; onMode?: (m: 'doc' | 'prompt') => void;
  animated?: boolean; live?: boolean;
}) {
  const [internal, setInternal] = useState<'doc' | 'prompt'>('doc');
  const m = onMode ? (modeProp ?? 'doc') : internal;
  const setM = onMode ?? setInternal;

  return (
    <div className="ocp">
      <div className="ocp__bar">
        <span className="ocp__dot" /><span className="ocp__dot" /><span className="ocp__dot" />
        <span className="ocp__file">atlas.ocp · {m === 'prompt' ? 'system_prompt' : 'profile'}</span>
        {onMode
          ? <div className="ocp-toggle" style={{ marginLeft: 'auto' }}>
              <button aria-pressed={m === 'doc'} onClick={() => setM('doc')}><Icons.file size={14} />Document</button>
              <button aria-pressed={m === 'prompt'} onClick={() => setM('prompt')}><Icons.terminal size={14} />Agent prompt</button>
            </div>
          : live && <span className="ocp__live">Living</span>}
      </div>
      <div className="ocp__head">
        <p className="ocp__team">Atlas · Payments Platform</p>
        <div className="ocp__meta"><span>9 people</span><span>schema v1.2</span><span>updated 2d ago</span></div>
      </div>
      {m === 'prompt'
        ? <PromptView />
        : <div className="ocp__body">
            {OCP_SECTIONS.map((s, i) =>
              animated
                ? <Reveal key={s.ix} delay={i * 80} y={12} threshold={0.05}><OCPSection s={s} /></Reveal>
                : <OCPSection key={s.ix} s={s} />
            )}
          </div>}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="onb-nav">
      <Wordmark />
      <div className="onb-nav__links">
        <a href="#how">How it works</a>
        <a href="#scenarios">Scenarios</a>
        <a href="#ocp">The OCP</a>
      </div>
      <div className="onb-nav__cta">
        <Btn variant="ghost" size="sm" href="/employee">Sign in</Btn>
        <Btn variant="primary" size="sm" href="/setup">Set up your team</Btn>
      </div>
    </nav>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function Steps() {
  return (
    <div className="steps">
      {STEPS.map((s, i) => {
        const IconC = Icons[s.icon];
        return (
          <div className="step" key={i}>
            <span className="step__n">{s.n}</span>
            <div className="step__ic"><IconC size={26} /></div>
            <h3 className="step__t">{s.t}</h3>
            <p className="step__d">{s.d}</p>
            {i < STEPS.length - 1 && <span className="step__arrow"><Icons.arrow size={20} /></span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__row">
          <Wordmark />
          <div className="foot__links">
            <a href="#how">How it works</a><a href="#scenarios">Scenarios</a><a href="#ocp">The OCP</a>
            <a href="#">Methodology</a><a href="#">API docs</a><Link href="/setup">Set up your team</Link>
          </div>
        </div>
        <p className="foot__fine">
          Onbora · the Universal Onboarding Protocol. The OCP schema is grounded in Richard Hackman&apos;s Team Design model.
        </p>
      </div>
    </footer>
  );
}

// ─── Landing page — Direction H · Fauna / Playful Blocks ────────────────────────

export default function LandingPage() {
  const [mode, setMode] = useState<'doc' | 'prompt'>('doc');

  return (
    <div className="onb dir-h">
      <Nav />

      {/* HERO */}
      <header className="wrap" style={{ paddingTop: 64, paddingBottom: 40, textAlign: 'center' }}>
        <Reveal immediate delay={40}>
          <p className="kicker" style={{ justifyContent: 'center', display: 'flex' }}>Universal Onboarding Protocol</p>
        </Reveal>
        <Reveal immediate delay={120}>
          <h1 className="display" style={{ fontSize: 'clamp(46px,7cqw,92px)', margin: '20px auto 0', maxWidth: 920 }}>
            Onboarding for everyone.<br /><span style={{ color: 'var(--pl-coral)' }}>Human and AI.</span>
          </h1>
        </Reveal>
        <Reveal immediate delay={240}>
          <p className="lead" style={{ maxWidth: 560, margin: '22px auto 0', fontSize: 19 }}>
            Onbora turns how your team works into one friendly, structured profile — so every new
            teammate, person or agent, starts on the same page.
          </p>
        </Reveal>
        <Reveal immediate delay={340}>
          <div style={{ display: 'flex', gap: 12, marginTop: 30, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn variant="primary" href="/setup">Set up your team</Btn>
            <Btn variant="ghost" href="#ocp">See a sample OCP</Btn>
          </div>
        </Reveal>
        <Reveal immediate delay={460}>
          <div className="h-media" style={{ marginTop: 50 }}>
            <HFigRow chars={CHARACTERS} />
          </div>
        </Reveal>
      </header>

      {/* VALUE CARDS */}
      <section className="wrap section">
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 44px' }}>
            <h2 className="h2">A modern way for teams to onboard.</h2>
          </div>
        </Reveal>
        <Reveal delay={120} y={24}>
          <div className="h-cards">
            {H_CARDS.map((c, i) => (
              <div className={`h-vcard${c.dark ? ' h-vcard--dark' : ''}`} key={i}>
                <div className="h-vcard__blocks">
                  {c.blocks.map((col, j) => (
                    <HShape key={j} shape={j === 1 ? 'circle' : 'sq'} w={22} color={col} />
                  ))}
                </div>
                <h3 className="h-vcard__t">{c.t}</h3>
                <p className="h-vcard__d">{c.d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="wrap section--tight">
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 44px' }}>
            <p className="kicker" style={{ justifyContent: 'center', display: 'flex' }}>How it works</p>
            <h2 className="h2" style={{ marginTop: 14 }}>Extract once. Keep it structured. Deliver to anyone.</h2>
          </div>
        </Reveal>
        <Reveal delay={120} y={24}><Steps /></Reveal>
      </section>

      {/* SCENARIOS — overlapping shapes Venn */}
      <section id="scenarios" style={{ background: 'var(--paper)' }}>
        <div className="wrap section">
          <div className="h-scn-grid">
            <Reveal>
              <div>
                <p className="kicker">Three scenarios</p>
                <h2 className="display" style={{ fontSize: 'clamp(30px,4.4cqw,52px)', marginTop: 16 }}>
                  One profile. Every new mind on the team.
                </h2>
                <p className="lead" style={{ marginTop: 18, maxWidth: 420 }}>
                  A new hire, an internal transfer, and an AI agent all need the same context. They all
                  read the same OCP.
                </p>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <div className="h-venn">
                <div className="h-blob" style={{ background: 'var(--pl-coral)', left: 115, top: 0, alignItems: 'flex-start' }}>
                  <span className="h-blob__t">New<br />employee</span>
                </div>
                <div className="h-blob" style={{ background: 'var(--pl-teal)', left: 8, top: 110, alignItems: 'flex-end' }}>
                  <span className="h-blob__t">Internal<br />transfer</span>
                </div>
                <div className="h-blob" style={{ background: 'var(--pl-mustard)', left: 222, top: 110, alignItems: 'flex-end' }}>
                  <span className="h-blob__t" style={{ color: '#2A2620' }}>AI<br />agent</span>
                </div>
                <div className="h-venn__core"><b>The OCP</b><span>one shared context</span></div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* OCP DEEP DIVE */}
      <section id="ocp" className="wrap section">
        <div className="dirA-ocp">
          <Reveal>
            <div style={{ position: 'sticky', top: 40 }}>
              <p className="kicker">The artifact</p>
              <h2 className="h2" style={{ marginTop: 14 }}>One document. The whole Team&nbsp;OS.</h2>
              <p className="body" style={{ marginTop: 18, maxWidth: 400 }}>
                Read it as a friendly structured document, or flip it to the exact system prompt an
                agent receives. Same source of truth, two surfaces.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120} y={24}><OCPDoc mode={mode} onMode={setMode} animated /></Reveal>
        </div>
      </section>

      {/* MAKE IT YOURS — block playground */}
      <section className="wrap section--tight">
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 40px' }}>
            <h2 className="h2">Build it around your team.</h2>
            <p className="lead" style={{ marginTop: 14 }}>Every team is assembled differently. The OCP captures yours, block by block.</p>
          </div>
        </Reveal>
        <Reveal delay={120} y={24}>
          <div className="h-media" style={{ padding: '52px 40px', background: 'var(--pl-amber)', border: 'none' }}>
            <HFigRow chars={[...CHARACTERS, ...CHARACTERS.slice(0, 3)]} />
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="wrap section--tight" style={{ paddingBottom: 90 }}>
        <Reveal>
          <div className="h-cta">
            <h2 className="display" style={{ fontSize: 'clamp(32px,4.8cqw,58px)', maxWidth: 760, margin: '0 auto' }}>
              Give your next teammate — human or AI — a real first day.
            </h2>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Btn variant="ivory" href="/setup">Set up your team</Btn>
              <Btn variant="ghost-light">Book a walkthrough</Btn>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
