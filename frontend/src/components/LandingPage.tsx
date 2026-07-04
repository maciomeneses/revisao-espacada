import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Database,
  History,
  Sparkles,
  FlaskConical,
} from 'lucide-react';

function Navbar({ scrolled, onLogin }: { scrolled: boolean; onLogin: () => void }) {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-ink/90 backdrop-blur-xl border-b border-white/10 py-3'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img
            src="/ebbing-icon.png?v=1"
            alt="Ebbing — plataforma de revisão espaçada"
            className="w-10 h-10 rounded-xl shadow-lg shadow-yellow/20 transition-transform group-hover:rotate-12 object-cover"
          />
          <span className="text-2xl font-bold tracking-tight">Ebbing</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#como-funciona"
            className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Como funciona
          </a>
          <a
            href="#algoritmo"
            className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Algoritmo
          </a>
        </div>

        <button
          onClick={onLogin}
          className="flex items-center gap-2 bg-yellow hover:bg-yellow-dark text-navy-dark px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-yellow/10"
        >
          Acessar Plataforma
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

function HeroDemo({
  step,
  containerRef,
}: {
  step: number;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const cursorPositionByStep: Record<number, string> = {
    0: 'top-5 left-10',
    1: 'top-12 left-1/2',
    2: 'top-[35%] left-[80%]',
    3: 'top-[50%] left-[80%]',
    4: 'top-[80%] left-1/2',
    5: 'top-[80%] left-1/2',
  };

  return (
    <div ref={containerRef} className="relative group transition-all duration-700 hover:rotate-1">
      <div
        className="absolute -inset-0.5 bg-gradient-to-r from-navy-light to-sky rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"
        aria-hidden="true"
      />

      <div className="relative rounded-[2.8rem] border border-white/10 bg-ink-soft p-3 shadow-2xl overflow-hidden scale-[0.85] sm:scale-100 origin-top">
        {/* Fake Browser Toolbar */}
        <div
          className="flex items-center gap-2 px-6 py-4 border-b border-white/5"
          aria-hidden="true"
        >
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>
          <div className="ml-4 flex-1 h-6 bg-white/5 rounded-full flex items-center px-4">
            <div className="w-20 h-1.5 bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="p-4 md:p-6 bg-ink aspect-square md:aspect-[4/3] rounded-[2rem] flex flex-col gap-4 md:gap-6 overflow-hidden relative">
          {/* Header Mockup */}
          <div
            className="flex justify-between items-center motion-safe:animate-pulse"
            aria-hidden="true"
          >
            <div className="w-24 h-4 bg-white/10 rounded-full" />
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow/10 flex items-center justify-center">
                <Database className="w-4 h-4 text-yellow" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5" />
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-2xl border transition-all duration-500 ${step === 1 ? 'bg-sky/10 border-sky/40 scale-105' : 'bg-white/5 border-white/5'}`}
            >
              <div className="w-1/2 h-2 bg-white/20 rounded-full mb-3" />
              <div className="text-2xl font-black text-sky">93%</div>
            </div>
            <div
              className={`p-4 rounded-2xl border transition-all duration-500 ${step === 4 ? 'bg-yellow/10 border-yellow/40 scale-105' : 'bg-white/5 border-white/5'}`}
            >
              <div className="w-1/2 h-2 bg-white/20 rounded-full mb-3" />
              <div className="text-2xl font-black text-yellow">24</div>
            </div>
          </div>

          {/* Review List Demo */}
          <div className="flex-1 bg-white/5 rounded-[1.5rem] p-4 flex flex-col gap-3 relative">
            <div className="flex justify-between items-center mb-2 px-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Próximas Revisões
              </div>
              <div
                className="w-3 h-3 rounded-full bg-red-400 motion-safe:animate-ping"
                aria-hidden="true"
              />
            </div>

            {[
              { name: 'Citologia', delay: 'Atrasado', color: 'bg-red-400' },
              { name: 'Cinemática', delay: '2h', color: 'bg-orange-400' },
              { name: 'História Geral', delay: 'Amanhã', color: 'bg-sky' },
            ].map((item, i) => (
              <div
                key={item.name}
                className={`flex justify-between items-center p-3 rounded-xl border border-white/5 transition-all duration-700 ${step === 2 && i === 0 ? 'bg-white/10 scale-[1.02] border-white/20' : 'bg-white/5 opacity-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} aria-hidden="true" />
                  <span className="text-sm font-bold">{item.name}</span>
                </div>
                <span className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-white/5 text-white/60">
                  {item.delay}
                </span>
              </div>
            ))}

            {/* Simulated Modal Overlay */}
            <div
              className={`absolute inset-0 bg-ink/95 backdrop-blur-sm z-10 p-4 md:p-6 flex flex-col items-center justify-center text-center transition-all duration-500 rounded-[1.5rem] ${step >= 1 && step <= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            >
              {step < 6 ? (
                <>
                  <img
                    src="/ebbing-icon.png?v=1"
                    className="w-8 h-8 rounded-lg mb-2 object-cover"
                    alt=""
                  />
                  <h4 className="font-bold mb-4 text-sm text-yellow">Revisão: Citologia</h4>

                  <div className="bg-white/5 p-4 rounded-xl w-full mb-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center bg-ink px-3 py-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-white/60 uppercase font-bold">
                        Total de Questões
                      </span>
                      <span
                        className={`text-sm font-black transition-all ${step >= 2 ? 'text-white' : 'text-transparent'}`}
                      >
                        15
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-ink px-3 py-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-white/60 uppercase font-bold">Acertos</span>
                      <span
                        className={`text-sm font-black transition-all ${step >= 3 ? 'text-green-400' : 'text-transparent'}`}
                      >
                        13
                      </span>
                    </div>
                  </div>

                  <button
                    className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${step === 4 ? 'bg-sky text-ink scale-105 shadow-lg shadow-sky/20' : step === 5 ? 'bg-sky-dark text-white scale-95' : 'bg-sky/10 text-sky'}`}
                  >
                    {step === 5 ? 'Calculando...' : 'Analisar Desempenho'}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full motion-safe:animate-fade-in-up">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-green-400" aria-hidden="true" />
                  </div>
                  <h4 className="font-black text-lg text-white mb-1">Taxa de Acertos: 86%</h4>
                  <p className="text-[10px] text-white/60 uppercase font-bold mb-6">
                    Eficiência Alta
                  </p>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full">
                    <p className="text-[10px] text-white/60 uppercase font-bold mb-2">
                      Próxima Revisão Agendada
                    </p>
                    <div className="text-xl font-black text-yellow mb-1">Daqui a 12 dias</div>
                    <p className="text-xs text-white/60">Adicionada ao seu calendário de estudos</p>
                  </div>
                </div>
              )}
            </div>

            {/* Virtual Cursor */}
            <div
              aria-hidden="true"
              className={`absolute w-5 h-5 bg-white/20 border-2 border-white/40 rounded-full z-[100] pointer-events-none transition-all duration-1000 mix-blend-difference hidden md:block ${cursorPositionByStep[step] ?? ''} ${step >= 6 ? 'opacity-0' : 'opacity-100'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection({
  demoStep,
  demoRef,
  onStart,
}: {
  demoStep: number;
  demoRef: RefObject<HTMLDivElement | null>;
  onStart: () => void;
}) {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <div
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky/10 rounded-full blur-[120px] -z-10 motion-safe:animate-pulse"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 text-center md:text-left grid md:grid-cols-2 gap-16 items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-yellow mb-8 motion-safe:animate-fade-in">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow"></span>
            </span>
            Repetição espaçada com algoritmo FSRS v6
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05]">
            Elimine o <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow via-[#ffd700] to-sky">
              esquecimento.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-xl">
            O Ebbing agenda a revisão de cada assunto com o algoritmo FSRS v6, estimando quando você
            está prestes a esquecer — sem cronograma manual e respeitando seus dias de estudo.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
            <button
              onClick={onStart}
              className="bg-yellow text-navy-dark px-10 py-4 rounded-2xl font-bold text-base hover:bg-yellow-dark transition-all flex items-center justify-center gap-3 shadow-2xl shadow-yellow/10"
            >
              Começar agora
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <HeroDemo step={demoStep} containerRef={demoRef} />
        <div className="md:hidden h-20" /> {/* Spacer for scaled mockup on mobile */}
      </div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { value: '1885', label: 'Ano em que Ebbinghaus descreveu a Curva do Esquecimento' },
    { value: '90%', label: 'Retenção-alvo de cada revisão agendada' },
    { value: 'FSRS v6', label: 'Algoritmo aberto de repetição espaçada' },
    { value: '100%', label: 'Das revisões encaixadas nos seus dias de estudo' },
  ];

  return (
    <section className="py-20 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
        {stats.map((stat) => (
          <div key={stat.value} className="text-center">
            <div className="text-4xl font-black mb-3 tracking-tight text-white">{stat.value}</div>
            <div className="text-white/60 text-xs font-semibold tracking-wide max-w-[16rem] mx-auto">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ForgettingCurveCard() {
  return (
    <div className="rounded-[2rem] md:rounded-[3rem] border border-white/10 bg-ink-soft shadow-2xl p-6 md:p-10 flex flex-col gap-6">
      <p className="text-xs font-bold uppercase tracking-widest text-white/60">
        A Curva do Esquecimento
      </p>

      <svg
        viewBox="0 0 400 300"
        role="img"
        aria-label="Gráfico da curva do esquecimento: sem revisão, a memória decai rapidamente; com revisões espaçadas, cada revisão restaura a retenção e o decaimento fica mais lento."
        className="w-full"
      >
        <path d="M20 20 V270 H380" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <path
          d="M20 40 C70 170, 140 235, 380 265"
          fill="none"
          stroke="#ffc72c"
          strokeWidth="2.5"
          strokeDasharray="6,6"
          className="opacity-80"
        />
        <path
          d="M20 40 C45 100, 70 130, 95 148 L95 64 C130 115, 165 135, 200 148 L200 76 C250 112, 310 124, 380 132"
          fill="none"
          stroke="#4fa3d1"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="20" cy="40" r="5" fill="#ffc72c" />
        <circle cx="95" cy="64" r="5" fill="#4fa3d1" />
        <circle cx="200" cy="76" r="5" fill="#4fa3d1" />
      </svg>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-white/60">
        <span className="flex items-center gap-2">
          <span className="w-4 border-t-2 border-dashed border-yellow" aria-hidden="true" />
          Sem revisão
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 border-t-2 border-sky" aria-hidden="true" />
          Com revisões espaçadas
        </span>
      </div>

      <blockquote className="border-t border-white/10 pt-6">
        <p className="text-lg md:text-xl font-medium italic text-white/90 leading-relaxed mb-4">
          "Toda sorte de ideias, se deixadas a si mesmas, é gradualmente esquecida."
        </p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <History className="w-5 h-5 text-yellow" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-yellow">Hermann Ebbinghaus</p>
            <p className="text-xs text-white/60">
              "Memória: uma contribuição à psicologia experimental", 1885
            </p>
          </div>
        </div>
      </blockquote>
    </div>
  );
}

function EbbinghausSection() {
  return (
    <section id="algoritmo" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-ink -z-20" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink via-navy/20 to-ink -z-10"
        aria-hidden="true"
      />

      {/* Abstract Background Element (The Curve) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none"
        aria-hidden="true"
      >
        <svg viewBox="0 0 1000 400" className="w-full h-full">
          <path
            d="M0,50 Q250,50 400,200 T1000,350"
            fill="none"
            stroke="white"
            strokeWidth="2"
            className="opacity-20"
          />
          <path
            d="M0,50 Q250,50 400,200 T1000,350"
            fill="none"
            stroke="#ffc72c"
            strokeWidth="4"
            strokeDasharray="10,10"
            className="motion-safe:animate-dash"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div className="order-2 md:order-1">
          <ForgettingCurveCard />
        </div>

        <div className="order-1 md:order-2 space-y-8">
          <div className="inline-flex items-center gap-2 bg-yellow/10 border border-yellow/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-yellow">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Nosso Tributo à Ciência
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
            O Legado de um <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">
              Visionário.
            </span>
          </h2>

          <div className="space-y-6 text-lg text-white/70 leading-relaxed">
            <p>
              Em 1885, Hermann Ebbinghaus mediu pela primeira vez um fenômeno fundamental da memória
              humana: <span className="text-white font-bold">a Curva do Esquecimento.</span>
            </p>
            <p>
              Seus experimentos mostraram que esquecemos rapidamente o que aprendemos — a menos que
              o conteúdo seja revisitado nos momentos certos.
            </p>
            <p>
              Nossa plataforma é uma homenagem ao homem que começou a decifrar a memória. O{' '}
              <span className="text-yellow font-bold">Ebbing</span> usa o FSRS v6, um algoritmo
              moderno de repetição espaçada, para domar a curva que Ebbinghaus descreveu há mais de
              um século.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-white/5">
            <div className="w-12 h-12 shrink-0 rounded-full bg-sky/10 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-sky" aria-hidden="true" />
            </div>
            <p className="text-sm text-white/70">
              O FSRS é um algoritmo de código aberto, avaliado em benchmarks públicos com milhões de
              revisões reais.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Database,
      accent: 'bg-yellow/10 text-yellow',
      title: 'Cronograma Inteligente',
      description:
        'Cada assunto é monitorado individualmente. O sistema sabe qual aula você já assistiu e qual precisa revisar hoje.',
    },
    {
      icon: TrendingUp,
      accent: 'bg-sky/10 text-sky',
      title: 'Espião Estratégico',
      description:
        'Gráficos de acurácia, volume de questões e novos conteúdos. Tenha uma visão de raio-x do seu progresso.',
    },
    {
      icon: ShieldCheck,
      accent: 'bg-yellow/10 text-yellow',
      title: 'Algoritmo FSRS v6',
      description:
        'Repetição espaçada de última geração: em benchmarks abertos, o FSRS supera algoritmos clássicos como o SM-2 — tanto que o próprio Anki passou a adotá-lo.',
    },
  ];

  return (
    <section id="como-funciona" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Projetado para quem busca a <br />
            <span className="text-yellow">máxima performance.</span>
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Esqueça cronogramas manuais. O Ebbing automatiza seu planejamento com base no seu
            desempenho real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${feature.accent}`}
              >
                <feature.icon className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="py-20 border-t border-white/5 bg-ink">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/ebbing-logo.png?v=1"
              alt="Ebbing — plataforma de revisão espaçada"
              className="h-10 rounded-lg object-contain"
            />
          </div>
          <p className="text-white/60 text-sm">Ciência da memória a serviço do seu estudo</p>
        </div>

        <div className="flex flex-col gap-3 items-center md:items-end">
          <span className="text-xs font-bold uppercase text-white/50 tracking-widest mb-2">
            Produto
          </span>
          <a
            href="#como-funciona"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Funcionalidades
          </a>
          <a href="#algoritmo" className="text-sm text-white/60 hover:text-white transition-colors">
            Algoritmo
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 text-center text-white/50 text-xs">
        © 2026 Ebbing — Plataforma de Revisão Espaçada. Todos os direitos reservados.
      </div>
    </footer>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [reducedMotion] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
  );
  const [demoStep, setDemoStep] = useState(reducedMotion ? 6 : 0);
  const [demoVisible, setDemoVisible] = useState(true);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pausa a demo quando o mockup sai do viewport (jsdom não tem IntersectionObserver)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !demoRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setDemoVisible(entry.isIntersecting));
    observer.observe(demoRef.current);
    return () => observer.disconnect();
  }, []);

  // Timer para a animação da demo
  useEffect(() => {
    if (reducedMotion || !demoVisible) return;
    const timer = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 8);
    }, 2000);
    return () => clearInterval(timer);
  }, [reducedMotion, demoVisible]);

  return (
    <div className="min-h-screen bg-ink text-white selection:bg-yellow/30 font-sans">
      <Navbar scrolled={scrolled} onLogin={() => navigate('/login')} />
      <HeroSection demoStep={demoStep} demoRef={demoRef} onStart={() => navigate('/login')} />
      <StatsStrip />
      <EbbinghausSection />
      <FeaturesSection />
      <FooterSection />
    </div>
  );
}
