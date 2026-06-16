import { useMemo, useState } from 'react';
import {
  TrendingUp,
  BookOpen,
  BarChart3,
  CheckCircle2,
  Calendar,
  Target,
  Trophy,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Subject } from '../types';
import type { ReviewEventPayload } from '../services/api';
import { localDateStr } from '../services/algorithm';

interface EspiaoEstrategicoProps {
  subjects: Subject[];
  reviewEvents: ReviewEventPayload[];
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Returns the real accuracy % from the event, falling back to a proxy for
// legacy events that predate the accuracy field (accuracy === 0).
function getAccuracy(e: ReviewEventPayload): number | null {
  if (e.accuracy > 0) return e.accuracy;
  // Fallback proxy for old data
  switch (e.performance) {
    case 'excelente':
      return 95;
    case 'bom':
      return 75;
    case 'medio':
      return 55;
    case 'ruim':
      return 20;
    default:
      return null;
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
        <p className="text-muted-light text-[10px] font-black uppercase tracking-widest leading-snug">
          {label}
        </p>
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

const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function buildWeeklyData(events: ReviewEventPayload[], numWeeks: number): ChartDataPoint[] {
  const today = new Date();
  const buckets: ChartDataPoint[] = [];

  for (let i = numWeeks - 1; i >= 0; i--) {
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - i * 7);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);

    const startStr = localDateStr(startDate);
    const endStr = localDateStr(endDate);

    const inBucket = events.filter((e) => e.reviewDate >= startStr && e.reviewDate <= endStr);

    const withAcc = inBucket.map((e) => getAccuracy(e)).filter((v): v is number => v !== null);
    const acuraciaMedia =
      withAcc.length > 0 ? Math.round(withAcc.reduce((a, v) => a + v, 0) / withAcc.length) : 0;

    const label = `${String(startDate.getDate()).padStart(2, '0')} ${MONTHS_SHORT[startDate.getMonth()]}`;

    buckets.push({
      label,
      totalQuestoes: inBucket.reduce((sum, e) => sum + e.questions, 0),
      acuraciaMedia,
      assuntosNovos: inBucket.filter((e) => e.reps === 1).length,
      revisoesConcluidas: inBucket.length,
    });
  }

  return buckets;
}

function buildMonthlyData(events: ReviewEventPayload[], numMonths: number): ChartDataPoint[] {
  const today = new Date();
  const buckets: ChartDataPoint[] = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const inBucket = events.filter((e) => e.reviewDate >= startStr && e.reviewDate <= endStr);

    const withAcc = inBucket.map((e) => getAccuracy(e)).filter((v): v is number => v !== null);
    const acuraciaMedia =
      withAcc.length > 0 ? Math.round(withAcc.reduce((a, v) => a + v, 0) / withAcc.length) : 0;

    const label = `${MONTHS_SHORT[month]}${year !== today.getFullYear() ? ` '${String(year).slice(2)}` : ''}`;

    buckets.push({
      label,
      totalQuestoes: inBucket.reduce((sum, e) => sum + e.questions, 0),
      acuraciaMedia,
      assuntosNovos: inBucket.filter((e) => e.reps === 1).length,
      revisoesConcluidas: inBucket.length,
    });
  }

  return buckets;
}

function getChartData(events: ReviewEventPayload[], filter: ChartFilter): ChartDataPoint[] {
  switch (filter) {
    case 'semanas':
      return buildWeeklyData(events, 8);
    case '3meses':
      return buildWeeklyData(events, 12);
    case '6meses':
      return buildMonthlyData(events, 6);
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

function MiniChart({
  data,
  dataKey,
  label,
  color,
  gradientId,
  icon: Icon,
  unit = '',
}: MiniChartProps) {
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
            labelStyle={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 9,
              fontWeight: 700,
              marginBottom: 2,
            }}
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

export function EspiaoEstrategico({ subjects, reviewEvents }: EspiaoEstrategicoProps) {
  const [chartFilter, setChartFilter] = useState<ChartFilter>('semanas');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyArea, setHistoryArea] = useState<string | null>(null);
  const [historySubjectId, setHistorySubjectId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const today = localDateStr(new Date());
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoff = localDateStr(cutoffDate);

    const recentEvents = reviewEvents.filter((e) => e.reviewDate >= cutoff);

    const totalAssuntos = subjects.length;
    // New subjects: events with reps === 1 in the last 7 days (unique subjects)
    const newSubjectIds = new Set(
      reviewEvents.filter((e) => e.reps === 1 && e.reviewDate >= cutoff).map((e) => e.subjectId),
    );
    const totalAssuntosRecent = newSubjectIds.size;

    // Total questions from event history
    const totalQuestoes = reviewEvents.reduce((sum, e) => sum + e.questions, 0);
    const totalQuestoesRecent = recentEvents.reduce((sum, e) => sum + e.questions, 0);

    const revisoesConcluidas = reviewEvents.length;
    const revisoesConcluidasRecent = recentEvents.length;

    const revisoesHoje = subjects.filter(
      (s) => s.nextReviewDate && s.nextReviewDate <= today,
    ).length;

    const conhecimentoEstavel = subjects.filter((s) => (s.stability || 0) > 30).length;
    const recentSubjects = subjects.filter((s) => s.lastReviewDate && s.lastReviewDate >= cutoff);
    const conhecimentoEstavelRecent = recentSubjects.filter((s) => (s.stability || 0) > 30).length;

    const withAcc = reviewEvents.map((e) => getAccuracy(e)).filter((v): v is number => v !== null);
    const avgAcc = withAcc.length > 0 ? withAcc.reduce((a, v) => a + v, 0) / withAcc.length : 0;

    const recentWithAcc = recentEvents
      .map((e) => getAccuracy(e))
      .filter((v): v is number => v !== null);
    const avgAccRecent =
      recentWithAcc.length > 0
        ? recentWithAcc.reduce((a, v) => a + v, 0) / recentWithAcc.length
        : null;

    return {
      totalAssuntos,
      totalAssuntosRecent,
      totalQuestoes,
      totalQuestoesRecent,
      revisoesConcluidas,
      revisoesConcluidasRecent,
      revisoesHoje,
      conhecimentoEstavel,
      conhecimentoEstavelRecent,
      avgAcc,
      avgAccRecent,
    };
  }, [subjects, reviewEvents]);

  const performerData = useMemo(() => {
    // Aggregate per-subject accuracy from event history
    const subjectAccMap = new Map<string, { name: string; area: string; accValues: number[] }>();
    for (const e of reviewEvents) {
      const acc = getAccuracy(e);
      if (acc === null) continue;
      if (!subjectAccMap.has(e.subjectId)) {
        // Try to find area from current subjects list
        const subj = subjects.find((s) => s.id === e.subjectId);
        subjectAccMap.set(e.subjectId, {
          name: e.subjectName,
          area: subj?.area ?? '',
          accValues: [],
        });
      }
      subjectAccMap.get(e.subjectId)!.accValues.push(acc);
    }

    const ranked = Array.from(subjectAccMap.entries())
      .map(([id, { name, area, accValues }]) => ({
        id,
        aulaPrincipal: name,
        area,
        acc: accValues.reduce((a, v) => a + v, 0) / accValues.length,
      }))
      .sort((a, b) => b.acc - a.acc);

    return {
      top: ranked.slice(0, 5),
      bottom: ranked.slice(-5).reverse(),
    };
  }, [subjects, reviewEvents]);

  const chartData = useMemo(
    () => getChartData(reviewEvents, chartFilter),
    [reviewEvents, chartFilter],
  );

  const historyData = useMemo(() => {
    const areaMap = new Map<string, Map<string, { name: string; events: ReviewEventPayload[] }>>();
    for (const e of reviewEvents) {
      const subj = subjects.find((s) => s.id === e.subjectId);
      const area = subj?.area ?? 'Sem área';
      if (!areaMap.has(area)) areaMap.set(area, new Map());
      const subjMap = areaMap.get(area)!;
      if (!subjMap.has(e.subjectId)) subjMap.set(e.subjectId, { name: e.subjectName, events: [] });
      subjMap.get(e.subjectId)!.events.push(e);
    }
    return areaMap;
  }, [subjects, reviewEvents]);

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryArea(null);
    setHistorySubjectId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Estatísticas</h2>
        <p className="text-muted text-sm mt-1 font-medium">
          Visão geral do seu progresso de estudos
        </p>
      </div>

      {/* Stat cards */}
      <div>
        <p className="text-[10px] font-black text-muted-light uppercase tracking-widest mb-3">
          Visão Geral
        </p>
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
          <div
            onClick={() => setHistoryOpen(true)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            title="Ver histórico de revisões"
          >
            <StatCard
              label="Revisões Concluídas"
              value={stats.revisoesConcluidas}
              deltaStr={
                stats.revisoesConcluidasRecent > 0 ? `+${stats.revisoesConcluidasRecent}` : null
              }
              color="text-green-600"
              icon={CheckCircle2}
            />
          </div>
          <StatCard
            label="Revisões para Hoje"
            value={stats.revisoesHoje}
            color="text-yellow-dark"
            icon={Calendar}
          />
          <StatCard
            label="Desempenho"
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
        <p className="text-[10px] font-black text-muted-light uppercase tracking-widest mb-3">
          Desempenho por Assunto
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Maiores desempenhos */}
          <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Trophy className="w-4 h-4 text-green-500 shrink-0" />
              <span className="font-black text-navy text-sm uppercase tracking-tight">
                Pontos Fortes
              </span>
            </div>
            <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto">
              {performerData.top.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-light text-xs font-black uppercase tracking-[0.2em]">
                    Nenhum dado ainda
                  </p>
                </div>
              ) : (
                performerData.top.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-navy font-bold text-sm truncate">{s.aulaPrincipal}</p>
                      <p className="text-muted-light text-[10px] font-black uppercase tracking-wider">
                        {s.area}
                      </p>
                    </div>
                    <span className="text-green-600 font-black text-sm shrink-0 ml-3">
                      {s.acc.toFixed(2)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Menores desempenhos */}
          <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-black text-navy text-sm uppercase tracking-tight">
                Pontos a Melhorar
              </span>
            </div>
            <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto">
              {performerData.bottom.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-light text-xs font-black uppercase tracking-[0.2em]">
                    Nenhum dado ainda
                  </p>
                </div>
              ) : (
                performerData.bottom.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-navy font-bold text-sm truncate">{s.aulaPrincipal}</p>
                      <p className="text-muted-light text-[10px] font-black uppercase tracking-wider">
                        {s.area}
                      </p>
                    </div>
                    <span className="text-amber-600 font-black text-sm shrink-0 ml-3">
                      {s.acc.toFixed(2)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── History panel ───────────────────────────────────────────── */}
      {historyOpen && (
        <div
          className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[200] flex justify-end"
          onClick={closeHistory}
        >
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-1 min-w-0">
                {historyArea && (
                  <button
                    onClick={() =>
                      historySubjectId ? setHistorySubjectId(null) : setHistoryArea(null)
                    }
                    className="p-1 text-muted-light hover:text-navy transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <p className="font-black text-navy text-sm uppercase tracking-tight truncate">
                  {historySubjectId
                    ? (historyData.get(historyArea!)?.get(historySubjectId)?.name ?? 'Revisões')
                    : (historyArea ?? 'Histórico de Revisões')}
                </p>
              </div>
              <button
                onClick={closeHistory}
                className="p-1 text-muted-light hover:text-navy transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Level 1 — areas */}
              {!historyArea &&
                (historyData.size === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-light text-xs font-black uppercase tracking-[0.2em]">
                      Nenhuma revisão registrada
                    </p>
                  </div>
                ) : (
                  Array.from(historyData.entries()).map(([area, subjMap]) => {
                    const total = Array.from(subjMap.values()).reduce(
                      (s, v) => s + v.events.length,
                      0,
                    );
                    return (
                      <button
                        key={area}
                        onClick={() => setHistoryArea(area)}
                        className="w-full flex items-center justify-between bg-surface hover:bg-navy/5 border border-border rounded-2xl px-4 py-3 transition-colors text-left"
                      >
                        <p className="font-bold text-navy text-sm truncate">{area}</p>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[10px] font-black text-muted-light">
                            {total} revisões
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-light" />
                        </div>
                      </button>
                    );
                  })
                ))}

              {/* Level 2 — subjects in area */}
              {historyArea &&
                !historySubjectId &&
                Array.from(historyData.get(historyArea)?.entries() ?? []).map(
                  ([subjId, { name, events }]) => {
                    const accValues = events
                      .map((e) => getAccuracy(e))
                      .filter((v): v is number => v !== null);
                    const avgAcc =
                      accValues.length > 0
                        ? Math.round(accValues.reduce((a, v) => a + v, 0) / accValues.length)
                        : null;
                    const totalSec = events.reduce((s, e) => s + (e.durationSeconds ?? 0), 0);
                    const durLabel =
                      totalSec > 0
                        ? `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m`
                        : null;
                    return (
                      <button
                        key={subjId}
                        onClick={() => setHistorySubjectId(subjId)}
                        className="w-full flex items-center justify-between bg-surface hover:bg-navy/5 border border-border rounded-2xl px-4 py-3 transition-colors text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-navy text-sm truncate">{name}</p>
                          <p className="text-[10px] text-muted font-bold">
                            {events.length} revisões
                            {avgAcc !== null ? ` • ${avgAcc}%` : ''}
                            {durLabel ? ` • ${durLabel}` : ''}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-light shrink-0 ml-2" />
                      </button>
                    );
                  },
                )}

              {/* Level 3 — individual events */}
              {historyArea &&
                historySubjectId &&
                (historyData.get(historyArea)?.get(historySubjectId)?.events ?? [])
                  .slice()
                  .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate))
                  .map((e, i) => {
                    const acc = getAccuracy(e);
                    const dur = e.durationSeconds ?? 0;
                    const h = Math.floor(dur / 3600);
                    const min = Math.floor((dur % 3600) / 60);
                    const sec = dur % 60;
                    const durStr = dur > 0 ? `${h > 0 ? `${h}h ` : ''}${min}m ${sec}s` : null;
                    const perfCls =
                      e.performance === 'excelente'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : e.performance === 'bom'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : e.performance === 'medio'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-red-50 text-red-600 border-red-200';
                    return (
                      <div
                        key={i}
                        className="bg-surface border border-border rounded-2xl px-4 py-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-navy">
                            {fmtDate(e.reviewDate)}
                          </span>
                          {acc !== null && (
                            <span className="text-sm font-black text-navy">{acc}%</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[10px] text-muted font-bold">
                            {e.questions} questões
                          </span>
                          {durStr && (
                            <span className="text-[10px] text-muted font-bold">{durStr}</span>
                          )}
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${perfCls}`}
                          >
                            {e.performance}
                          </span>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
