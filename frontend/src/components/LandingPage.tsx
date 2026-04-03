import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  Cpu,
  ChevronRight,
  Database
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Timer para a animação da demo
  useEffect(() => {
    let timer: any;
    if (isDemoActive) {
      timer = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % 5);
      }, 2500);
    } else {
      setDemoStep(0);
    }
    return () => clearInterval(timer);
  }, [isDemoActive]);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white selection:bg-cyan-500/30 font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#0A0F1E]/90 backdrop-blur-xl border-b border-white/10 py-3' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-[#FFC72C] rounded-xl flex items-center justify-center shadow-lg shadow-[#FFC72C]/20 transition-transform group-hover:rotate-12">
              <Brain className="text-[#1F3A5F] w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">
              Ebbin
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#como-funciona" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Como funciona</a>
            <a href="#algoritmo" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Algoritmo</a>
            <a href="#beneficios" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Benefícios</a>
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
              <button 
                onClick={() => setIsDemoActive(!isDemoActive)}
                className={`group border ${isDemoActive ? 'border-[#FFC72C] text-[#FFC72C]' : 'border-white/10 text-white'} px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/5 transition-all text-center flex items-center justify-center gap-3`}
              >
                {isDemoActive ? 'Parar Demonstração' : 'Ver demonstração'}
                <div className={`w-2 h-2 rounded-full ${isDemoActive ? 'bg-[#FFC72C] animate-ping' : 'bg-white/20'}`} />
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
              <div className="p-6 bg-[#0A0F1E] aspect-[4/3] rounded-[2rem] flex flex-col gap-6 overflow-hidden">
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

                   {/* Simulated Modal Overlay (Demo Step 3 & 4) */}
                   <div className={`absolute inset-0 bg-[#0A0F1E]/95 backdrop-blur-sm z-10 p-8 flex flex-col items-center justify-center text-center transition-all duration-500 rounded-[1.5rem] ${demoStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                      <Brain className="w-10 h-10 text-cyan-400 mb-4 animate-bounce" />
                      <h4 className="font-bold mb-1">Revisão: Citologia</h4>
                      <p className="text-[10px] text-white/40 mb-6">Como foi seu desempenho?</p>

                      <div className="flex gap-2 mb-6">
                        {[1,2,3,4].map(btn => (
                          <div key={btn} className={`w-8 h-8 rounded-lg ${demoStep === 4 && btn === 3 ? 'bg-[#FFC72C] scale-110 shadow-lg' : 'bg-white/10'}`} />
                        ))}
                      </div>
                      
                      <div className={`w-full py-2 rounded-xl bg-cyan-400 text-[#0A0F1E] text-[10px] font-black uppercase translate-y-${demoStep === 4 ? '0 opacity-100' : '4 opacity-0'} transition-all`}>
                        Salvando Progresso...
                      </div>
                   </div>

                   {/* Virtual Cursor */}
                   <div className={`absolute w-6 h-6 bg-white/20 border-2 border-white/40 rounded-full z-[100] pointer-events-none transition-all duration-1000 mix-blend-difference hidden md:block
                     ${demoStep === 0 ? 'top-10 left-10' : ''}
                     ${demoStep === 1 ? 'top-20 left-40' : ''}
                     ${demoStep === 2 ? 'top-1/2 left-20' : ''}
                     ${demoStep === 3 ? 'top-2/3 left-1/2' : ''}
                     ${demoStep === 4 ? 'top-3/4 left-1/2' : ''}
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
            <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Retenção de longo prazo</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black mb-2 tracking-tighter">4.0x</div>
            <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Velocidade de aprendizado</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black mb-2 tracking-tighter">100k+</div>
            <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Flashcards Revisados</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black mb-2 tracking-tighter">0.1ms</div>
            <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Tempo de latência FSRS</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="como-funciona" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Projetado para quem busca a <br/><span className="text-cyan-400">máxima performance.</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto">Esqueça cronogramas manuais. O Ebbin automatiza seu planejamento com base no seu desempenho real.</p>
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
              <span className="text-xl font-black tracking-tight">Ebbin</span>
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
