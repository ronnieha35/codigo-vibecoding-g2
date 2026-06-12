"use client";

import { useEffect, useRef, useState } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValue,
  useSpring,
  useInView,
} from "framer-motion";
import { useTheme } from "next-themes";
import {
  MapPin,
  LayoutDashboard,
  GitBranch,
  Layers,
  Smartphone,
  ArrowRight,
  Menu,
  X,
  Star,
  Check,
  Zap,
  Shield,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  Mail,
  Share2,
  Code2,
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "#features", label: "Funciones" },
  { href: "#how-it-works", label: "Cómo funciona" },
  { href: "#testimonials", label: "Clientes" },
];

const LOGOS = [
  "CerámicasDel Sur", "FarmaGroup", "DistribuidoraCentral", "TransLogXpress",
  "MercadoNorte", "SupplyChain Pro", "Logística Andina", "FlotaMax Enterprise",
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Tracking en tiempo real",
    description: "Monitorea toda tu flota y envíos con un mapa interactivo. Visualiza posición, velocidad y estado de cada unidad al instante.",
    featured: false,
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard de operaciones",
    description: "KPIs, alertas automáticas y reportes personalizados. Toma decisiones basadas en datos sin perder tiempo buscando información dispersa en múltiples sistemas.",
    featured: true,
  },
  {
    icon: GitBranch,
    title: "Rutas optimizadas con IA",
    description: "Reduce hasta 23% en costos de combustible. Algoritmos que calculan la ruta óptima considerando tráfico, carga y restricciones viales.",
    featured: false,
  },
  {
    icon: Layers,
    title: "Integración ERP & SAP",
    description: "Conecta con tu ecosistema: SAP, Oracle, facturación electrónica. Implementación en días, no meses.",
    featured: false,
  },
  {
    icon: Smartphone,
    title: "App móvil para conductores",
    description: "Firma digital, evidencia fotográfica y comunicación directa. Todo lo que el conductor necesita en su celular.",
    featured: false,
  },
];

const STEPS = [
  {
    number: "01",
    title: "Conecta tu flota",
    description: "Instala nuestro dispositivo GPS o usa la app móvil. Tu flota aparece en el mapa en menos de 30 minutos sin configuraciones complejas.",
  },
  {
    number: "02",
    title: "Planifica rutas con IA",
    description: "Define origen, destinos y paradas. La IA calcula la ruta óptima en tiempo real considerando tráfico, peso y restricciones viales.",
  },
  {
    number: "03",
    title: "Monitorea en tiempo real",
    description: "Recibe alertas de desvíos, retrasos o incidentes. Comunícate con conductores directamente desde el dashboard central.",
  },
  {
    number: "04",
    title: "Analiza y optimiza",
    description: "Reportes automáticos de desempeño por conductor, ruta y vehículo. Identifica oportunidades de ahorro concretas cada semana.",
  },
];

const TESTIMONIALS = [
  {
    quote: "Redujimos costos de combustible en 23% en el primer trimestre. La optimización de rutas es simplemente impresionante.",
    name: "Juan Carlos Méndez", role: "Director de Operaciones", company: "CerámicasDel Sur",
    rating: 5, initials: "JM",
  },
  {
    quote: "El tracking en tiempo real cambió completamente la forma en que gestionamos nuestros 80 vehículos. Ahora tenemos visibilidad total.",
    name: "María González", role: "Supply Chain Manager", company: "FarmaGroup",
    rating: 5, initials: "MG",
  },
  {
    quote: "Integramos SAP en 2 semanas. El equipo de soporte es excepcional y la documentación muy completa.",
    name: "Roberto Torres", role: "CTO", company: "DistribuidoraCentral",
    rating: 5, initials: "RT",
  },
  {
    quote: "Los conductores adoptaron la app desde el primer día. La firma digital eliminó completamente el papeleo.",
    name: "Ana Gutiérrez", role: "Gerente de Flota", company: "TransLogXpress",
    rating: 5, initials: "AG",
  },
  {
    quote: "Los reportes automáticos nos ahorran 8 horas de trabajo administrativo cada semana. ROI inmediato.",
    name: "Carlos Pimentel", role: "Jefe de Logística", company: "MercadoNorte",
    rating: 5, initials: "CP",
  },
];

const HEADLINE_WORDS = "Mueve más, gestiona menos.".split(" ");

const FLOATING_BADGES = [
  { icon: Check,  label: "+240 empresas", glowClass: "lp-badge-primary-glow", floatClass: "animate-lp-float",   posClass: "left-[-12%] top-[18%]" },
  { icon: Zap,    label: "23% ahorro",    glowClass: "lp-badge-accent-glow",   floatClass: "animate-lp-float-1", posClass: "left-[78%] top-[6%]" },
  { icon: Shield, label: "99.9% uptime",  glowClass: "lp-badge-primary-glow",  floatClass: "animate-lp-float-2", posClass: "left-[68%] top-[74%]" },
];

const FOOTER_LINKS = {
  Producto: ["Funciones", "Integraciones", "Precios", "Changelog"],
  Empresa: ["Sobre nosotros", "Blog", "Careers", "Press"],
  Recursos: ["Documentación", "API Reference", "Status", "Soporte"],
  Legal: ["Privacidad", "Términos", "Cookies", "Seguridad"],
};

const SOCIAL_ICONS = [
  { icon: Share2, label: "Social" },
  { icon: Code2,  label: "GitHub" },
  { icon: Globe,  label: "Website" },
  { icon: Mail,   label: "Email" },
];

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;
  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-lp-text/70 hover:bg-lp-primary/10 transition-all duration-200 cursor-pointer"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

// ─── Particle Canvas ──────────────────────────────────────────────────────────

function ParticleCanvas() {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const colorsRef = useRef({ p: "rgba(37,99,235,0.32)", l: "rgba(37,99,235,0.11)" });

  useEffect(() => {
    colorsRef.current = resolvedTheme === "dark"
      ? { p: "rgba(59,130,246,0.40)", l: "rgba(59,130,246,0.14)" }
      : { p: "rgba(37,99,235,0.32)", l: "rgba(37,99,235,0.11)" };
  }, [resolvedTheme]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const onMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    window.addEventListener("mousemove", onMouse);

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    const N = 80;
    const pts: P[] = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.5 + 0.5,
    }));

    const CONN = 120;
    let lastTime = 0;

    const tick = (time: number) => {
      // cap at ~50fps to reduce CPU on slow machines
      if (time - lastTime < 18) { rafRef.current = requestAnimationFrame(tick); return; }
      lastTime = time;

      const w = canvas.width; const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const { x: mx, y: my } = mouseRef.current;
      const { p: pc, l: lc } = colorsRef.current;

      for (const p of pts) {
        const dx = mx - p.x; const dy = my - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 150 && d > 0) { p.vx += (dx / d) * 0.009; p.vy += (dy / d) * 0.009; }
        p.vx *= 0.98; p.vy *= 0.98;
        p.x = Math.max(0, Math.min(w, p.x + p.vx));
        p.y = Math.max(0, Math.min(h, p.y + p.vy));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = pc; ctx.fill();
      }

      ctx.lineWidth = 0.6;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x; const dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CONN * CONN) {
            const alpha = (1 - Math.sqrt(d2) / CONN) * 0.12;
            ctx.strokeStyle = lc.replace(/[\d.]+\)$/, `${alpha})`);
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); window.removeEventListener("mousemove", onMouse); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />;
}

// ─── Magnetic Button ──────────────────────────────────────────────────────────

function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0); const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 25 });
  const sy = useSpring(y, { stiffness: 300, damping: 25 });
  return (
    <m.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * 0.28);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.28);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={className}
    >
      {children}
    </m.div>
  );
}

// ─── Tilt Card ────────────────────────────────────────────────────────────────

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0); const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 300, damping: 30 });
  const sry = useSpring(ry, { stiffness: 300, damping: 30 });
  return (
    <m.div
      ref={ref}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 800 }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10);
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
      className={className}
    >
      {children}
    </m.div>
  );
}

// ─── Scroll Reveal ────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </m.div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <m.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: scrolled ? 1 : 0, y: scrolled ? 0 : -20 }}
      transition={{ duration: 0.28 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-3"
      aria-hidden={!scrolled}
    >
      <div className="glass-nav max-w-6xl mx-auto flex items-center justify-between px-6 py-3 rounded-2xl">
        <span className="font-heading font-bold text-xl text-lp-text tracking-tight">
          Logistica
        </span>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="text-sm font-medium text-lp-text/75 hover:text-lp-primary transition-colors duration-200 cursor-pointer">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <MagneticButton>
            <a href="#cta" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-lp-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-200 cursor-pointer">
              Solicitar demo <ArrowRight size={14} />
            </a>
          </MagneticButton>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setOpen(!open)} className="cursor-pointer p-1 text-lp-text" aria-label={open ? "Cerrar menú" : "Abrir menú"}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass-nav md:hidden max-w-6xl mx-auto mt-2 rounded-2xl px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="text-sm font-medium text-lp-text cursor-pointer">{l.label}</a>
          ))}
          <a href="#cta" onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-lp-accent text-white text-sm font-semibold cursor-pointer">
            Solicitar demo
          </a>
        </div>
      )}
    </m.header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-lp-bg">
      {/* Mesh gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="lp-blob-a absolute w-[60%] h-[75%] -top-[15%] -right-[5%]" />
        <div className="lp-blob-b absolute w-[55%] h-[60%] bottom-0 -left-[8%]" />
        <div className="lp-blob-c absolute w-[45%] h-[45%] top-[35%] left-[35%]" />
        <div className="lp-grid absolute inset-0" />
      </div>

      <ParticleCanvas />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center py-28">
        {/* Left copy */}
        <div className="flex flex-col gap-6">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lp-badge inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-xs font-semibold text-lp-primary"
          >
            <Zap size={12} />
            Plataforma líder en LATAM
          </m.div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-lp-text leading-[1.08]">
            {HEADLINE_WORDS.map((word, i) => (
              <m.span
                key={i}
                initial={{ opacity: 0, y: 60, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="inline-block mr-3"
              >
                {word}
              </m.span>
            ))}
          </h1>

          <m.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-lg text-lp-text/65 leading-relaxed max-w-lg"
          >
            Logística inteligente para empresas que no se detienen. Tracking en tiempo real, rutas optimizadas con IA y visibilidad total de tu cadena de suministro.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            <MagneticButton>
              <a href="#cta"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-lp-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity duration-200 cursor-pointer lp-cta-shadow">
                Solicitar demo gratuita <ArrowRight size={15} />
              </a>
            </MagneticButton>
            <MagneticButton>
              <a href="#features"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-lp-primary text-lp-primary font-semibold text-sm hover:bg-lp-primary/5 transition-colors duration-200 cursor-pointer">
                Ver funciones <ChevronRight size={15} />
              </a>
            </MagneticButton>
          </m.div>

          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex items-center gap-4 pt-1"
          >
            <div className="flex -space-x-2">
              {["JM", "MG", "RT", "AG"].map((init, i) => (
                <div key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-lp-bg"
                  style={{ background: i % 2 === 0 ? "#2563EB" : "#3B82F6" }}>
                  {init}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-lp-accent text-lp-accent" />)}
              </div>
              <p className="text-xs text-lp-text/50 mt-0.5">+240 empresas confían en nosotros</p>
            </div>
          </m.div>
        </div>

        {/* Right dashboard card */}
        <m.div
          initial={{ opacity: 0, x: 50, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative"
        >
          <div className="glass-hero-card relative rounded-3xl p-6 overflow-hidden">
            <div className="lp-inner-glow absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold text-lp-text/45 uppercase tracking-widest mb-4">
                Panel de Control · En vivo
              </p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Envíos activos", value: "142", trend: "+8%" },
                  { label: "En ruta",        value: "89%", trend: "+3%" },
                  { label: "Entregas hoy",   value: "47",  trend: "+12%" },
                  { label: "Ahorro mensual", value: "$23K", trend: "+23%" },
                ].map((kpi, i) => (
                  <div key={i} className="lp-kpi rounded-xl p-3">
                    <p className="text-xs text-lp-text/45">{kpi.label}</p>
                    <p className="text-2xl font-heading font-bold text-lp-text mt-0.5">{kpi.value}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{kpi.trend}</p>
                  </div>
                ))}
              </div>
              <div className="mb-5">
                <div className="flex justify-between text-xs text-lp-text/55 mb-1.5">
                  <span>Eficiencia de flota</span>
                  <span className="font-semibold text-lp-text">94%</span>
                </div>
                <div className="lp-progress-track h-2 rounded-full overflow-hidden">
                  <div className="animate-lp-progress h-full rounded-full bg-lp-primary" />
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { route: "CDMX → Monterrey", status: "En ruta",    dot: "#10b981" },
                  { route: "Bogotá → Medellín", status: "Entregado", dot: "#2563EB" },
                  { route: "Lima → Arequipa",   status: "Pendiente", dot: "#F97316" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.dot }} />
                      <span className="text-lp-text/65">{r.route}</span>
                    </div>
                    <span className="font-medium text-lp-text/75">{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating badges — CSS animations, no Framer Motion loop */}
          {FLOATING_BADGES.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <div key={i} className={`absolute hidden lg:flex ${badge.floatClass} ${badge.posClass}`}>
                <div className={`${badge.glowClass} flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white whitespace-nowrap`}>
                  <Icon size={12} /> {badge.label}
                </div>
              </div>
            );
          })}
        </m.div>
      </div>

      {/* Scroll indicator — CSS animation */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-5 h-8 rounded-full border-2 border-lp-primary/25 flex items-start justify-center pt-1.5">
          <div className="animate-lp-scroll w-1 h-2 rounded-full bg-lp-primary/35" />
        </div>
      </m.div>
    </section>
  );
}

// ─── Logos Bar ────────────────────────────────────────────────────────────────

function LogosBar() {
  return (
    <section className="py-12 overflow-hidden bg-lp-bg2/50 border-y border-lp-border">
      <p className="text-center text-xs font-semibold text-lp-text/35 uppercase tracking-widest mb-8">
        Empresas que confían en Logistica
      </p>
      {/* CSS marquee — no Framer Motion */}
      <div className="flex overflow-hidden">
        <div className="animate-marquee flex gap-16 items-center whitespace-nowrap">
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <span key={i} className="text-sm font-semibold text-lp-text/28 shrink-0 select-none">{logo}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-lp-bg relative overflow-hidden">
      <div className="lp-blob-a absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <Reveal className="text-center mb-16">
          <p className="text-xs font-semibold text-lp-accent uppercase tracking-widest mb-3">Funcionalidades</p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-lp-text mb-4">
            Todo lo que necesitas,{" "}
            <span className="text-lp-primary">en un solo lugar</span>
          </h2>
          <p className="text-lg text-lp-text/55 max-w-2xl mx-auto">
            Desde el tracking en tiempo real hasta la integración con tu ERP. Logistica centraliza toda tu operación.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={i} delay={i * 0.08} className={f.featured ? "md:col-span-2" : ""}>
                <div className="glass-card glass-hover h-full rounded-2xl p-6 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${f.featured ? "lp-feat-icon-active" : "lp-feat-icon"}`}>
                      <Icon size={20} className={f.featured ? "text-lp-accent" : "text-lp-primary"} />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-lp-text text-lg mb-2">{f.title}</h3>
                      <p className="text-lp-text/58 text-sm leading-relaxed">{f.description}</p>
                      {f.featured && (
                        <a href="#cta" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-lp-accent hover:gap-2.5 transition-all duration-200 cursor-pointer">
                          Ver demo en vivo <ArrowRight size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-lp-bg2 relative">
      <div className="lp-grid-lg absolute inset-0 pointer-events-none" />
      <div className="max-w-5xl mx-auto px-4 md:px-8 relative">
        <Reveal className="text-center mb-16">
          <p className="text-xs font-semibold text-lp-accent uppercase tracking-widest mb-3">Proceso</p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-lp-text mb-4">
            En marcha en <span className="text-lp-primary">4 pasos</span>
          </h2>
          <p className="text-lg text-lp-text/55 max-w-xl mx-auto">
            Desde la conexión de tu flota hasta los primeros reportes. Sin complejidad, sin fricciones.
          </p>
        </Reveal>

        <div className="space-y-10">
          {STEPS.map((step, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}>
                <div className="shrink-0">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${i === 0 ? "lp-step1-box" : "lp-step-box"}`}>
                    <span className={`text-2xl font-heading font-bold ${i === 0 ? "text-lp-accent" : "text-lp-primary"}`}>{step.number}</span>
                  </div>
                </div>
                <div className="glass-card flex-1 rounded-2xl p-6">
                  <h3 className="text-xl font-heading font-semibold text-lp-text mb-2">{step.title}</h3>
                  <p className="text-lp-text/60 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-lp-bg">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <Reveal className="text-center mb-16">
          <p className="text-xs font-semibold text-lp-accent uppercase tracking-widest mb-3">Testimonios</p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-lp-text mb-4">
            Lo que dicen <span className="text-lp-primary">nuestros clientes</span>
          </h2>
          <p className="text-lg text-lp-text/55 max-w-xl mx-auto">
            Empresas de logística en toda Latinoamérica confían su operación a Logistica.
          </p>
        </Reveal>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 0.07} className="break-inside-avoid mb-5 block">
              <TiltCard>
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={13} className="fill-lp-accent text-lp-accent" />)}
                  </div>
                  <p className="text-lp-text/65 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: i % 2 === 0 ? "#2563EB" : "#3B82F6" }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-lp-text">{t.name}</p>
                      <p className="text-xs text-lp-text/45">{t.role} · {t.company}</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="cta" className="py-24 bg-lp-bg2">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <Reveal>
          {/* Rotating gradient border — CSS animation, no Framer Motion loop */}
          <div className="relative rounded-3xl p-[1.5px] overflow-hidden">
            <div
              className="animate-lp-rotate absolute"
              style={{
                top: "-50%", left: "-50%", width: "200%", height: "200%",
                background: "conic-gradient(from 0deg, #2563EB 0%, #3B82F6 30%, #F97316 60%, #2563EB 100%)",
              }}
            />
            <div className="glass-cta relative text-center px-8 py-14 md:py-18 md:px-16 rounded-[calc(1.5rem-1.5px)]">
              <p className="text-xs font-semibold text-lp-accent uppercase tracking-widest mb-4">
                Demo gratuita · Sin compromisos
              </p>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-lp-text mb-4">
                ¿Listo para transformar<br />
                <span className="text-lp-primary">tu logística?</span>
              </h2>
              <p className="text-lg text-lp-text/60 mb-10 max-w-xl mx-auto">
                Agenda una demo personalizada. Te mostramos cómo Logistica se adapta a tu operación en 30 minutos.
              </p>

              {submitted ? (
                <m.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-semibold text-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Check size={14} />
                  </div>
                  ¡Gracias! Te contactamos en menos de 24h.
                </m.div>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); if (email) setSubmitted(true); }}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    required
                    className="flex-1 px-4 py-3 rounded-xl border border-lp-border bg-lp-bg2 text-lp-text placeholder:text-lp-text/30 focus:outline-none focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/15 transition-all duration-200 text-sm"
                  />
                  <MagneticButton>
                    <button type="submit"
                      className="px-6 py-3 rounded-xl bg-lp-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity duration-200 cursor-pointer whitespace-nowrap lp-cta-shadow">
                      Solicitar demo
                    </button>
                  </MagneticButton>
                </form>
              )}

              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-lp-text/40">
                {["Sin tarjeta de crédito", "Setup en 30 min", "Soporte en español"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check size={11} className="text-lp-primary/50" /> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterSection() {
  return (
    <footer className="lp-footer-bg">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <p className="font-heading font-bold text-xl text-white mb-3">Logistica</p>
            <p className="text-sm text-white/50 leading-relaxed mb-5">
              Logística inteligente para empresas que no se detienen.
            </p>
            <div className="flex gap-2">
              {SOCIAL_ICONS.map(({ icon: Icon, label }) => (
                <button key={label} aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer">
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <p className="text-xs font-semibold text-white/55 uppercase tracking-widest mb-4">{title}</p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/40 hover:text-white transition-colors duration-200 cursor-pointer">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/28">
          <p>© {new Date().getFullYear()} Logistica Web. Todos los derechos reservados.</p>
          <p>Hecho con precisión para América Latina</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <LazyMotion features={domAnimation}>
      <NavBar />
      <HeroSection />
      <LogosBar />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <FooterSection />
    </LazyMotion>
  );
}
