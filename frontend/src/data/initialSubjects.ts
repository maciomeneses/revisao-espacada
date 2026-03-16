import type { Subject } from '../types';

function makeSubject(
  id: string,
  modulo: string,
  area: Subject['area'],
  aulaPrincipal: string,
  relevancia: Subject['relevancia'],
): Subject {
  return {
    id,
    modulo,
    area,
    aulaPrincipal,
    relevancia,
    aulaAssistida: false,
    preAulaFeita: false,
    flashcardsFeitos: false,
    currentStage: 'aula',
    nextReviewDate: null,
    lastReviewDate: null,
    lastPerformance: null,
    performanceLevel: 'nao_classificada',
  };
}

export const INITIAL_SUBJECTS: Subject[] = [
  // ── FÍSICA ──────────────────────────────────────────────────────────────────
  makeSubject('fis001', 'FÍSICA 001', 'FÍSICA', 'Cinemática — MRU e MRUV', 'Média'),
  makeSubject('fis002', 'FÍSICA 002', 'FÍSICA', 'Leis de Newton', 'Alta'),
  makeSubject('fis003', 'FÍSICA 003', 'FÍSICA', 'Energia, Trabalho e Potência', 'Alta'),
  makeSubject('fis004', 'FÍSICA 004', 'FÍSICA', 'Impulso e Momento Linear', 'Média'),
  makeSubject('fis005', 'FÍSICA 005', 'FÍSICA', 'Gravitação Universal', 'Baixa'),
  makeSubject('fis006', 'FÍSICA 006', 'FÍSICA', 'Hidrostática e Fluidos', 'Média'),
  makeSubject('fis007', 'FÍSICA 007', 'FÍSICA', 'Termologia — Temperatura e Calor', 'Alta'),
  makeSubject('fis008', 'FÍSICA 008', 'FÍSICA', 'Termodinâmica', 'Alta'),
  makeSubject('fis009', 'FÍSICA 009', 'FÍSICA', 'Óptica Geométrica', 'Média'),
  makeSubject('fis010', 'FÍSICA 010', 'FÍSICA', 'Ondulatória e Som', 'Média'),
  makeSubject('fis011', 'FÍSICA 011', 'FÍSICA', 'Eletrostática', 'Alta'),
  makeSubject('fis012', 'FÍSICA 012', 'FÍSICA', 'Eletrodinâmica — Circuitos Elétricos', 'Alta'),
  makeSubject('fis013', 'FÍSICA 013', 'FÍSICA', 'Magnetismo e Eletromagnetismo', 'Média'),
  makeSubject('fis014', 'FÍSICA 014', 'FÍSICA', 'Física Moderna e Nuclear', 'Baixa'),

  // ── QUÍMICA ─────────────────────────────────────────────────────────────────
  makeSubject('qui001', 'QUÍMICA 001', 'QUÍMICA', 'Matéria, Átomos e Modelos Atômicos', 'Média'),
  makeSubject('qui002', 'QUÍMICA 002', 'QUÍMICA', 'Tabela Periódica e Ligações Químicas', 'Alta'),
  makeSubject('qui003', 'QUÍMICA 003', 'QUÍMICA', 'Funções Inorgânicas — Ácidos, Bases e Sais', 'Alta'),
  makeSubject('qui004', 'QUÍMICA 004', 'QUÍMICA', 'Reações Químicas e Estequiometria', 'Alta'),
  makeSubject('qui005', 'QUÍMICA 005', 'QUÍMICA', 'Soluções e Propriedades Coligativas', 'Alta'),
  makeSubject('qui006', 'QUÍMICA 006', 'QUÍMICA', 'Termoquímica', 'Média'),
  makeSubject('qui007', 'QUÍMICA 007', 'QUÍMICA', 'Cinética e Equilíbrio Químico', 'Alta'),
  makeSubject('qui008', 'QUÍMICA 008', 'QUÍMICA', 'Eletroquímica', 'Média'),
  makeSubject('qui009', 'QUÍMICA 009', 'QUÍMICA', 'Química Orgânica — Introdução e Funções', 'Alta'),
  makeSubject('qui010', 'QUÍMICA 010', 'QUÍMICA', 'Reações Orgânicas e Polímeros', 'Alta'),
  makeSubject('qui011', 'QUÍMICA 011', 'QUÍMICA', 'Bioquímica — Carboidratos, Lipídios e Proteínas', 'Média'),

  // ── BIOLOGIA ────────────────────────────────────────────────────────────────
  makeSubject('bio001', 'BIOLOGIA 001', 'BIOLOGIA', 'Bioquímica Celular', 'Média'),
  makeSubject('bio002', 'BIOLOGIA 002', 'BIOLOGIA', 'Citologia — Estrutura e Organelas Celulares', 'Alta'),
  makeSubject('bio003', 'BIOLOGIA 003', 'BIOLOGIA', 'Divisão Celular — Mitose e Meiose', 'Alta'),
  makeSubject('bio004', 'BIOLOGIA 004', 'BIOLOGIA', 'Genética Mendeliana', 'Alta'),
  makeSubject('bio005', 'BIOLOGIA 005', 'BIOLOGIA', 'Genética Molecular — DNA, RNA e Proteínas', 'Alta'),
  makeSubject('bio006', 'BIOLOGIA 006', 'BIOLOGIA', 'Mutações, Biotecnologia e Engenharia Genética', 'Média'),
  makeSubject('bio007', 'BIOLOGIA 007', 'BIOLOGIA', 'Evolução Biológica', 'Alta'),
  makeSubject('bio008', 'BIOLOGIA 008', 'BIOLOGIA', 'Ecologia — Ecossistemas e Relações Ecológicas', 'Alta'),
  makeSubject('bio009', 'BIOLOGIA 009', 'BIOLOGIA', 'Fisiologia Humana — Digestório e Circulatório', 'Alta'),
  makeSubject('bio010', 'BIOLOGIA 010', 'BIOLOGIA', 'Fisiologia Humana — Nervoso, Endócrino e Imune', 'Alta'),
  makeSubject('bio011', 'BIOLOGIA 011', 'BIOLOGIA', 'Vírus, Bactérias, Fungos e Protistas', 'Média'),
  makeSubject('bio012', 'BIOLOGIA 012', 'BIOLOGIA', 'Botânica', 'Baixa'),

  // ── MATEMÁTICA ──────────────────────────────────────────────────────────────
  makeSubject('mat001', 'MATEMÁTICA 001', 'MATEMÁTICA', 'Conjuntos, Funções e Gráficos', 'Alta'),
  makeSubject('mat002', 'MATEMÁTICA 002', 'MATEMÁTICA', 'Funções Quadráticas e Exponenciais', 'Alta'),
  makeSubject('mat003', 'MATEMÁTICA 003', 'MATEMÁTICA', 'Logaritmos', 'Média'),
  makeSubject('mat004', 'MATEMÁTICA 004', 'MATEMÁTICA', 'Progressões Aritmética e Geométrica', 'Média'),
  makeSubject('mat005', 'MATEMÁTICA 005', 'MATEMÁTICA', 'Trigonometria', 'Alta'),
  makeSubject('mat006', 'MATEMÁTICA 006', 'MATEMÁTICA', 'Geometria Plana', 'Alta'),
  makeSubject('mat007', 'MATEMÁTICA 007', 'MATEMÁTICA', 'Geometria Espacial e Analítica', 'Alta'),
  makeSubject('mat008', 'MATEMÁTICA 008', 'MATEMÁTICA', 'Matrizes, Determinantes e Sistemas Lineares', 'Média'),
  makeSubject('mat009', 'MATEMÁTICA 009', 'MATEMÁTICA', 'Probabilidade', 'Alta'),
  makeSubject('mat010', 'MATEMÁTICA 010', 'MATEMÁTICA', 'Estatística — Média, Mediana e Moda', 'Alta'),
  makeSubject('mat011', 'MATEMÁTICA 011', 'MATEMÁTICA', 'Análise Combinatória', 'Alta'),
  makeSubject('mat012', 'MATEMÁTICA 012', 'MATEMÁTICA', 'Matemática Financeira — Juros e Porcentagem', 'Alta'),
];
