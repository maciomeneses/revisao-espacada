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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white selection:bg-cyan-500/30">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0A0F1E]/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Brain className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Ebbin
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Como funciona</a>
            <a href="#algoritmo" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Algoritmo FSRS</a>
            <a href="#beneficios" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Benefícios</a>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
          >
            Login
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-cyan-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-[0.2em] text-cyan-400 mb-6 animate-fade-in">
              <Cpu className="w-3 h-3" />
              Powered by FSRS v4 Algorithm
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
              Domine seu aprendizado com <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">precisão científica.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-10 leading-relaxed font-medium">
              O Ebbin utiliza algoritmos de ponta para prever o momento exato do seu esquecimento. Revise menos, memorize mais e alcance a excelência acadêmica.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                Começar agora
                <ChevronRight className="w-5 h-5" />
              </button>
              <a 
                href="#como-funciona"
                className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all text-center flex items-center justify-center"
              >
                Ver demonstração
              </a>
            </div>
          </div>
        </div>

        {/* Dashboard Mockup Preview */}
        <div className="mt-20 max-w-7xl mx-auto px-6 relative translate-y-12 animate-float">
          <div className="rounded-[2.5rem] border border-white/10 bg-[#161C2E]/40 backdrop-blur-2xl p-4 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="aspect-[16/9] bg-[#0A0F1E] rounded-[1.8rem] overflow-hidden border border-white/5 p-6 flex flex-col gap-6">
              <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <div className="flex gap-2">
                  <div className="w-10 h-3 bg-white/10 rounded-full" />
                  <div className="w-16 h-3 bg-white/5 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5" />
                  <div className="w-24 h-8 rounded-full bg-cyan-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 flex-1">
                <div className="bg-white/5 rounded-3xl p-6 flex flex-col justify-end">
                   <div className="w-full h-1/2 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-2xl mb-4" />
                   <div className="w-1/2 h-4 bg-white/10 rounded-full" />
                </div>
                <div className="col-span-2 bg-white/5 rounded-3xl p-6 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                   <div className="w-1/3 h-6 bg-white/20 rounded-full mb-6" />
                   <div className="space-y-3">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                         <div className="w-1/2 h-3 bg-white/10 rounded-full" />
                         <div className="w-12 h-3 bg-white/5 rounded-full" />
                       </div>
                     ))}
                   </div>
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
