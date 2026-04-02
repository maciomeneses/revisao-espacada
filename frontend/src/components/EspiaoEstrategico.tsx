import { useMemo, useState } from 'react';
import {
  TrendingUp, BookOpen, BarChart3, CheckCircle2, Calendar,
  Zap, Target, Trophy, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
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

// ── Stat card ────────────────────────────────────────────────────────────────

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

// ── Chart helpers ─────────────────────────────────────────────────────────────

type ChartFilter = 'semanas' | '3meses' | '6meses';

interface ChartDataPoint {
  label: string;
  totalQuestoes: number;
  acuraciaMedia: number;
  assuntosNovos: number;
  revisoesConcluidas: number;
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function buildWeeklyData(subjects: Subject[], numWeeks: number): ChartDataPoint[] {
  const today = new Date();
  const buckets: ChartDataPoint[] = [];

  for (let i = numWeeks - 1; i >= 0; i--) {
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - i * 7);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);

    const startStr = localDateStr(startDate);
    const endStr = localDateStr(endDate);

    const inBucket = subjects.filter(
      s => s.lastReviewDate && s.lastReviewDate >= startStr && s.lastReviewDate <= endStr,
    );

    const withAcc = inBucket.map(subjectAcc).filter((v): v is number => v !== null);
    const acuraciaMedia = withAcc.length > 0
      ? Math.round(withAcc.reduce((a, v) => a + v, 0) / withAcc.length)
      : 0;

    const label = `${String(startDate.getDate()).padStart(2, '0')} ${MONTHS_SHORT[startDate.getMonth()]}`;

    buckets.push({
      label,
      totalQuestoes: inBucket.length * 10,
      acuraciaMedia,
      assuntosNovos: inBucket.filter(s => (s.reps ?? 0) <= 1).length,
      revisoesConcluidas: inBucket.length,
    });
  }

  return buckets;
}

function buildMonthlyData(subjects: Subject[], numMonths: number): ChartDataPoint[] {
  const today = new Date();
  const buckets: ChartDataPoint[] = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const inBucket = subjects.filter(
      s => s.lastReviewDate && s.lastReviewDate >= startStr && s.lastReviewDate <= endStr,
    );

    const withAcc = inBucket.map(subjectAcc).filter((v): v is number => v !== null);
    const acuraciaMedia = withAcc.length > 0
      ? Math.round(withAcc.reduce((a, v) => a + v, 0) / withAcc.length)
      : 0;

    const label = `${MONTHS_SHORT[month]}${year !== today.getFullYear() ? ` '${String(year).slice(2)}` : ''}`;

    buckets.push({
      label,
      totalQuestoes: inBucket.length * 10,
      acuraciaMedia,
      assuntosNovos: inBucket.filter(s => (s.reps ?? 0) <= 1).length,
      revisoesConcluidas: inBucket.length,
    });
  }

  return buckets;
}

function getChartData(subjects: Subject[], filter: ChartFilter): ChartDataPoint[] {
  switch (filter) {
    case 'semanas': return buildWeeklyData(subjects, 8);
    case '3meses':  return buildWeeklyData(subjects, 12);
    case '6meses':  return buildMonthlyData(subjects, 6);
  }
}

// ── Mini chart card ───────────────────────────────────────────────────────────

interface MiniChartProps {
  data: ChartDataPoint[];
  dataKey: keyof ChartDataPoint;
  label: string;
  color: string;
  gradientId: string;
  icon: React.ElementType;
  unit?: string;
}

function MiniChart({ data, dataKey, label, color, gradientId, icon: Icon, unit = '' }: MiniChartProps) {
  return (
    <div className="bg-white border border-border rounded-3xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="font-black text-navy text-sm">{label}</span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: '#9ba3af', fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#9ba3af', fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            tickCount={4}
          />
          <Tooltip
            contentStyle={{
              background: '#1F3A5F',
              border: 'none',
              borderRadius: 10,
              padding: '6px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: 700, marginBottom: 2 }}
            itemStyle={{ color: '#fff', fontSize: 12, fontWeight: 900, padding: 0 }}
            formatter={(v) => [`${v}${unit}`, label]}
          />
          <Area
            type="monotone"
            dataKey={dataKey as string}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color, strokeWidth: 2, strokeOpacity: 0.3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EspiaoEstrategico({ subjects }: EspiaoEstrategicoProps) {
  const [chartFilter, setChartFilter] = useState<ChartFilter>('semanas');

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

  const chartData = useMemo(
    () => getChartData(subjects, chartFilter),
    [subjects, chartFilter],
  );

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

      {/* Evolution charts */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-[10px] font-black text-muted-light uppercase tracking-widest">
            Evolução ao longo do tempo
          </p>
          <div className="flex items-center bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            {(['semanas', '3meses', '6meses'] as ChartFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setChartFilter(f)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                  chartFilter === f
                    ? 'bg-navy text-white'
                    : 'text-muted hover:bg-surface hover:text-navy'
                }`}
              >
                {f === 'semanas' ? 'Semanas' : f === '3meses' ? '3 meses' : '6 meses'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MiniChart
            data={chartData}
            dataKey="totalQuestoes"
            label="Total de questões"
            color="#38bdf8"
            gradientId="gradQuestoes"
            icon={BarChart3}
          />
          <MiniChart
            data={chartData}
            dataKey="acuraciaMedia"
            label="Acurácia média (%)"
            color="#22c55e"
            gradientId="gradAcuracia"
            icon={Target}
            unit="%"
          />
          <MiniChart
            data={chartData}
            dataKey="assuntosNovos"
            label="Assuntos novos"
            color="#a855f7"
            gradientId="gradAssuntos"
            icon={BookOpen}
          />
          <MiniChart
            data={chartData}
            dataKey="revisoesConcluidas"
            label="Revisões concluídas"
            color="#f59e0b"
            gradientId="gradRevisoes"
            icon={CheckCircle2}
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
