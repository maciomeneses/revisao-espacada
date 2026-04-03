import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight,
  Database,
  History,
  Sparkles
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Timer para a animação da demo
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 8);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white selection:bg-cyan-500/30 font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#0A0F1E]/90 backdrop-blur-xl border-b border-white/10 py-3' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-[#FFC72C] rounded-xl flex items-center justify-center shadow-lg shadow-[#FFC72C]/20 transition-transform group-hover:rotate-12">
              <Brain className="text-[#1F3A5F] w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">
              Ebbing
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#como-funciona" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Como funciona</a>
            <a href="#algoritmo" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Algoritmo</a>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-[#FFC72C] hover:bg-[#e6b000] text-[#1F3A5F] px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#FFC72C]/10"
          >
            Acessar Plataforma
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center md:text-left grid md:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-[0.2em] text-[#FFC72C] mb-8 animate-fade-in shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC72C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFC72C]"></span>
              </span>
              Inteligência Artificial FSRS v4.0
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05]">
              Elimine o <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC72C] via-[#FFD700] to-cyan-400">esquecimento.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/50 mb-10 leading-relaxed font-medium max-w-xl">
              Nossa tecnologia prevê o momento exato em que seu cérebro deixará de lembrar. Transforme horas de estudo em conhecimento permanente.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
              <button 
                onClick={() => navigate('/login')}
                className="bg-white text-[#0A0F1E] px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-white/5"
              >
                Começar agora
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Hero Dashboard */}
          <div className="relative group transition-all duration-700 hover:rotate-1">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative rounded-[2.8rem] border border-white/10 bg-[#0D1225] p-3 shadow-2xl overflow-hidden">
              {/* Fake Browser Toolbar */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <div className="ml-4 flex-1 h-6 bg-white/5 rounded-full flex items-center px-4">
                  <div className="w-20 h-1.5 bg-white/10 rounded-full" />
                </div>
              </div>

              {/* Real-ish Dashboard Mockup */}
              <div className="p-4 md:p-6 bg-[#0A0F1E] aspect-square md:aspect-[4/3] rounded-[2rem] flex flex-col gap-4 md:gap-6 overflow-hidden relative">
                {/* Header Mockup */}
                <div className="flex justify-between items-center animate-pulse">
                  <div className="w-24 h-4 bg-white/10 rounded-full" />
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FFC72C]/10 flex items-center justify-center">
                       <Database className="w-4 h-4 text-[#FFC72C]" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5" />
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 gap-4">
                   <div className={`p-4 rounded-2xl border transition-all duration-500 ${demoStep === 1 ? 'bg-cyan-500/10 border-cyan-500/40 scale-105' : 'bg-white/5 border-white/5'}`}>
                      <div className="w-1/2 h-2 bg-white/20 rounded-full mb-3" />
                      <div className="text-2xl font-black text-cyan-400">93%</div>
                   </div>
                   <div className={`p-4 rounded-2xl border transition-all duration-500 ${demoStep === 4 ? 'bg-[#FFC72C]/10 border-[#FFC72C]/40 scale-105' : 'bg-white/5 border-white/5'}`}>
                      <div className="w-1/2 h-2 bg-white/20 rounded-full mb-3" />
                      <div className="text-2xl font-black text-[#FFC72C]">24</div>
                   </div>
                </div>

                {/* Review List Demo */}
                <div className="flex-1 bg-white/5 rounded-[1.5rem] p-4 flex flex-col gap-3 relative">
                   <div className="flex justify-between items-center mb-2 px-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Próximas Revisões</div>
                      <div className="w-3 h-3 rounded-full bg-red-400 animate-ping" />
                   </div>

                   {[
                     { name: 'Citologia', delay: 'Atrasado', color: 'bg-red-400' },
                     { name: 'Cinemática', delay: '2h', color: 'bg-orange-400' },
                     { name: 'História Geral', delay: 'Amanhã', color: 'bg-cyan-400' }
                   ].map((item, i) => (
                     <div 
                        key={item.name} 
                        className={`flex justify-between items-center p-3 rounded-xl border border-white/5 transition-all duration-700 ${demoStep === 2 && i === 0 ? 'bg-white/10 scale-102 border-white/20' : 'bg-white/5 opacity-50'}`}
                      >
                       <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${item.color}`} />
                         <span className="text-sm font-bold">{item.name}</span>
                       </div>
                       <span className={`text-[9px] font-black uppercase px-2 py-1 rounded bg-white/5 text-white/40`}>{item.delay}</span>
                     </div>
                   ))}

                   {/* Simulated Modal Overlay */}
                   <div className={`absolute inset-0 bg-[#0A0F1E]/95 backdrop-blur-sm z-10 p-4 md:p-6 flex flex-col items-center justify-center text-center transition-all duration-500 rounded-[1.5rem] ${demoStep >= 1 && demoStep <= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                      {demoStep < 6 ? (
                        <>
                          <Brain className="w-8 h-8 text-cyan-400 mb-2" />
                          <h4 className="font-bold mb-4 text-sm text-[#FFC72C]">Revisão: Citologia</h4>
                          
                          <div className="bg-white/5 p-4 rounded-xl w-full mb-4 flex flex-col gap-3">
                            <div className="flex justify-between items-center bg-[#0A0F1E] px-3 py-2 rounded-lg border border-white/5">
                              <span className="text-[10px] text-white/50 uppercase font-bold">Total de Questões</span>
                              <span className={`text-sm font-black transition-all ${demoStep >= 2 ? 'text-white' : 'text-transparent'}`}>15</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#0A0F1E] px-3 py-2 rounded-lg border border-white/5">
                              <span className="text-[10px] text-white/50 uppercase font-bold">Acertos</span>
                              <span className={`text-sm font-black transition-all ${demoStep >= 3 ? 'text-green-400' : 'text-transparent'}`}>13</span>
                            </div>
                          </div>

                          <button className={`w-full py-2.5 rounded-xl text-xs font-black uppercase transition-all ${demoStep === 4 ? 'bg-cyan-500/80 text-[#0A0F1E] scale-105 shadow-lg shadow-cyan-500/20' : demoStep === 5 ? 'bg-cyan-400 text-[#0A0F1E] scale-95' : 'bg-cyan-500/10 text-cyan-400'}`}>
                            {demoStep === 5 ? 'Calculando...' : 'Analisar Desempenho'}
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full animate-fade-in fade-in-up">
                           <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                             <ShieldCheck className="w-6 h-6 text-green-400" />
                           </div>
                           <h4 className="font-black text-lg text-white mb-1">Taxa de Acertos: 86%</h4>
                           <p className="text-[10px] text-white/50 uppercase font-bold mb-6">Eficiência Alta</p>

                           <div className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full">
                              <p className="text-[10px] text-white/40 uppercase font-bold mb-2">Próxima Revisão Agendada</p>
                              <div className="text-xl font-black text-[#FFC72C] mb-1">Daqui a 12 dias</div>
                              <p className="text-xs text-white/60">14 de Abril no Calendário</p>
                           </div>
                        </div>
                      )}
                   </div>

                   {/* Virtual Cursor */}
                   <div className={`absolute w-5 h-5 bg-white/20 border-2 border-white/40 rounded-full z-[100] pointer-events-none transition-all duration-1000 mix-blend-difference hidden md:block
                     ${demoStep === 0 ? 'top-5 left-10' : ''}
                     ${demoStep === 1 ? 'top-12 left-1/2' : ''}          {/* Hover over item */}
                     ${demoStep === 2 ? 'top-[35%] left-[80%]' : ''}     {/* Filling Total Questions */}
                     ${demoStep === 3 ? 'top-[50%] left-[80%]' : ''}     {/* Filling Correct Questions */}
                     ${demoStep === 4 || demoStep === 5 ? 'top-[80%] left-1/2' : ''} {/* Clicking button */}
                     ${demoStep >= 6 ? 'top-[90%] left-[90%] opacity-0' : 'opacity-100'} {/* Hide after click */}
                   `} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Quick Look */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="text-center">
            <div className="text-4xl font-black mb-2 tracking-tighter">95%</div>
            <div className="text-white/40 text-[10px] uppercase font-black tracking-widest">Retenção de longo prazo</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black mb-2 tracking-tighter">4.0x</div>
            <div className="text-white/40 text-[10px] uppercase font-black tracking-widest">Velocidade de aprendizado</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black mb-2 tracking-tighter">100k+</div>
            <div className="text-white/40 text-[10px] uppercase font-black tracking-widest">Flashcards Revisados</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black mb-2 tracking-tighter">0.1ms</div>
            <div className="text-white/40 text-[10px] uppercase font-black tracking-widest">Tempo de latência FSRS</div>
          </div>
        </div>
      </section>

      {/* Legacy/Ebbinghaus Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[#0A0F1E] -z-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1E] via-blue-900/10 to-[#0A0F1E] -z-10" />
        
        {/* Abstract Background Element (The Curve) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
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
              stroke="#FFC72C" 
              strokeWidth="4" 
              strokeDasharray="10,10"
              className="animate-[dash_60s_linear_infinite]"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
          <div className="order-2 md:order-1">
            <div className="relative rounded-[3rem] overflow-hidden border border-white/10 group aspect-square shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1544652252-870098df2462?auto=format&fit=crop&q=80&w=1000" 
                alt="Vision of Knowledge"
                className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000 opacity-60"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20">
                <blockquote className="text-xl font-bold italic text-white/90 leading-relaxed mb-4">
                  "As representações mentais duram menos do que se imagina, mas a ciência pode torná-las imortais."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <History className="w-5 h-5 text-[#FFC72C]" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-[#FFC72C]">Hermann Ebbinghaus</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] italic">O Pai da Ciência da Memória</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 space-y-8">
            <div className="inline-flex items-center gap-2 bg-[#FFC72C]/10 border border-[#FFC72C]/20 px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-[0.2em] text-[#FFC72C]">
              <Sparkles className="w-3.5 h-3.5" />
              Nosso Tributo à Ciência
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              O Legado de um <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Visionário.</span>
            </h2>

            <div className="space-y-6 text-lg text-white/60 leading-relaxed font-medium">
              <p>
                Em 1885, Hermann Ebbinghaus descobriu um segredo fundamental da consciência humana: <span className="text-white font-bold">A Curva do Esquecimento.</span>
              </p>
              <p>
                Pela primeira vez, a ciência provou matematicamente que o cérebro descarta informações em uma velocidade alarmante a menos que sejam revisitadas estrategicamente.
              </p>
              <p>
                Nossa plataforma não é apenas uma ferramenta de estudos. É uma homenagem ao homem que começou a decifrar a memória. O <span className="text-[#FFC72C] font-black uppercase italic tracking-tighter">Ebbing</span> utiliza o poder da IA moderna (FSRS) para finalmente domar a curva que Ebbinghaus descreveu há mais de um século.
              </p>
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-white/5">
              <div className="flex -space-x-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-[#0A0F1E] bg-white/5 flex items-center justify-center backdrop-blur-sm overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-black text-white">+100k estudantes</p>
                <p className="text-xs text-white/30 font-bold uppercase tracking-widest">Domando o esquecimento</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="como-funciona" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Projetado para quem busca a <br/><span className="text-cyan-400">máxima performance.</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto">Esqueça cronogramas manuais. O Ebbing automatiza seu planejamento com base no seu desempenho real.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform">
                <Database className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-4">Cronograma Inteligente</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Cada assunto é monitorado individualmente. O sistema sabe qual aula você já assistiu e qual precisa revisar hoje.
              </p>
            </div>

            <div className="group p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 active:scale-95">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-4">Espião Estratégico</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Gráficos de acurácia, volume de questões e novos conteúdos. Tenha uma visão de raio-x do seu progresso.
              </p>
            </div>

            <div className="group p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-4">Algoritmo FSRS v4</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Utilizamos o estado da arte em repetição espaçada. A versão 4 do FSRS é mais precisa que o Anki e SuperMemo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#0A0F1E]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight">Ebbing</span>
            </div>
            <p className="text-white/30 text-xs uppercase tracking-widest font-black">Engineering the future of memory</p>
          </div>
          
          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-black uppercase text-white/20 tracking-widest mb-2">Produto</span>
              <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Funcionalidades</a>
              <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Algoritmo</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-black uppercase text-white/20 tracking-widest mb-2">Legal</span>
              <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Termos</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest">
           © 2026 Ebbing Plataforma de Revisão. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
