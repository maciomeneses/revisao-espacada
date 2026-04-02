import { useMemo } from 'react';
import {
  TrendingUp, BookOpen, BarChart3, CheckCircle2, Calendar,
  Zap, Target, Trophy, AlertCircle,
} from 'lucide-react';
import type { Subject } from '../types';
import { localDateStr } from '../services/algorithm';

interface EspiaoEstrategicoProps {
  subjects: Subject[];
}

// Maps performanceLevel to an approximate accuracy % based on numCorrect thresholds.
// lapses-based formula always returns 100% after fixação (first review never increments lapses).
function subjectAcc(s: Subject): number | null {
  switch (s.performanceLevel) {
    case 'excelente': return 95;  // numCorrect 9–10
    case 'bom':       return 75;  // numCorrect 7–8
    case 'medio':     return 55;  // numCorrect 5–6
    case 'ruim':      return 20;  // numCorrect 0–4
    default:          return null;
  }
}

interface StatCardProps {
  label: string;
  value: string | number;
  deltaStr?: string | null;
  color: string;
  icon: React.ElementType;
}

function StatCard({ label, value, deltaStr, color, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-muted-light text-[10px] font-black uppercase tracking-widest leading-snug">{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-navy/5 shrink-0 ml-2">
          <Icon className="w-4 h-4 text-navy/40" />
        </div>
      </div>
      <p className={`text-4xl font-black ${color} mb-2`}>{value}</p>
      {deltaStr != null && (
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-500 shrink-0" />
          <p className="text-[10px] font-black text-green-600">{deltaStr} nos últimos 7 dias</p>
        </div>
      )}
    </div>
  );
}

export function EspiaoEstrategico({ subjects }: EspiaoEstrategicoProps) {
  const stats = useMemo(() => {
    const today = localDateStr(new Date());
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoff = localDateStr(cutoffDate);

    const recent = subjects.filter(s => s.lastReviewDate && s.lastReviewDate >= cutoff);

    const totalAssuntos = subjects.length;
    // Subjects whose first review happened in the last 7 days
    const totalAssuntosRecent = subjects.filter(
      s => s.reps === 1 && s.lastReviewDate && s.lastReviewDate >= cutoff,
    ).length;

    // Each review session ≈ 10 questions (proxy derived from reps count)
    const totalQuestoes = subjects.reduce((acc, s) => acc + (s.reps || 0) * 10, 0);
    const totalQuestoesRecent = recent.length * 10;

    const revisoesConcluidas = subjects.reduce((acc, s) => acc + (s.reps || 0), 0);
    const revisoesConcluidasRecent = recent.length;

    const revisoesHoje = subjects.filter(s => s.nextReviewDate && s.nextReviewDate <= today).length;

    const conhecimentoEstavel = subjects.filter(s => (s.stability || 0) > 30).length;
    const conhecimentoEstavelRecent = recent.filter(s => (s.stability || 0) > 30).length;

    const withAcc = subjects.map(subjectAcc).filter((v): v is number => v !== null);
    const avgAcc = withAcc.length > 0
      ? withAcc.reduce((a, v) => a + v, 0) / withAcc.length
      : 0;

    const recentWithAcc = recent.map(subjectAcc).filter((v): v is number => v !== null);
    const avgAccRecent = recentWithAcc.length > 0
      ? recentWithAcc.reduce((a, v) => a + v, 0) / recentWithAcc.length
      : null;

    return {
      totalAssuntos, totalAssuntosRecent,
      totalQuestoes, totalQuestoesRecent,
      revisoesConcluidas, revisoesConcluidasRecent,
      revisoesHoje,
      conhecimentoEstavel, conhecimentoEstavelRecent,
      avgAcc, avgAccRecent,
    };
  }, [subjects]);

  const performerData = useMemo(() => {
    const ranked = subjects
      .map(s => ({ ...s, acc: subjectAcc(s) }))
      .filter((s): s is typeof s & { acc: number } => s.acc !== null)
      .sort((a, b) => b.acc - a.acc);
    return {
      top: ranked.slice(0, 5),
      bottom: ranked.slice(-5).reverse(),
    };
  }, [subjects]);

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Estatísticas</h2>
        <p className="text-muted text-sm mt-1 font-medium">Visão geral do seu progresso de estudos</p>
      </div>

      {/* Stat cards */}
      <div>
        <p className="text-[10px] font-black text-muted-light uppercase tracking-widest mb-3">Visão Geral</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total de Assuntos"
            value={stats.totalAssuntos}
            deltaStr={stats.totalAssuntosRecent > 0 ? `+${stats.totalAssuntosRecent}` : null}
            color="text-navy"
            icon={BookOpen}
          />
          <StatCard
            label="Total de Questões"
            value={stats.totalQuestoes.toLocaleString('pt-BR')}
            deltaStr={stats.totalQuestoesRecent > 0 ? `+${stats.totalQuestoesRecent}` : null}
            color="text-indigo-600"
            icon={BarChart3}
          />
          <StatCard
            label="Revisões Concluídas"
            value={stats.revisoesConcluidas}
            deltaStr={stats.revisoesConcluidasRecent > 0 ? `+${stats.revisoesConcluidasRecent}` : null}
            color="text-green-600"
            icon={CheckCircle2}
          />
          <StatCard
            label="Revisões para Hoje"
            value={stats.revisoesHoje}
            color="text-yellow-dark"
            icon={Calendar}
          />
          <StatCard
            label="Conhecimento Estável"
            value={stats.conhecimentoEstavel}
            deltaStr={stats.conhecimentoEstavelRecent > 0 ? `+${stats.conhecimentoEstavelRecent}` : null}
            color="text-green-600"
            icon={Zap}
          />
          <StatCard
            label="Acurácia Média"
            value={`${stats.avgAcc.toFixed(1)}%`}
            deltaStr={stats.avgAccRecent != null ? `${stats.avgAccRecent.toFixed(1)}%` : null}
            color="text-amber-500"
            icon={Target}
          />
        </div>
      </div>

      {/* Performance lists */}
      <div>
        <p className="text-[10px] font-black text-muted-light uppercase tracking-widest mb-3">Desempenho por Assunto</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Maiores desempenhos */}
          <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Trophy className="w-4 h-4 text-green-500 shrink-0" />
              <span className="font-black text-navy text-sm uppercase tracking-tight">Maiores Desempenhos</span>
            </div>
            <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto">
              {performerData.top.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-light text-xs font-black uppercase tracking-[0.2em]">Nenhum dado ainda</p>
                </div>
              ) : (
                performerData.top.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-navy font-bold text-sm truncate">{s.aulaPrincipal}</p>
                      <p className="text-muted-light text-[10px] font-black uppercase tracking-wider">{s.area}</p>
                    </div>
                    <span className="text-green-600 font-black text-sm shrink-0 ml-3">{s.acc.toFixed(2)}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Menores desempenhos */}
          <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-black text-navy text-sm uppercase tracking-tight">Menores Desempenhos</span>
            </div>
            <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto">
              {performerData.bottom.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-light text-xs font-black uppercase tracking-[0.2em]">Nenhum dado ainda</p>
                </div>
              ) : (
                performerData.bottom.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-navy font-bold text-sm truncate">{s.aulaPrincipal}</p>
                      <p className="text-muted-light text-[10px] font-black uppercase tracking-wider">{s.area}</p>
                    </div>
                    <span className="text-amber-600 font-black text-sm shrink-0 ml-3">{s.acc.toFixed(2)}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
