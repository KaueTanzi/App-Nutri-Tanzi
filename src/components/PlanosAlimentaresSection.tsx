import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Plus,
  Save,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Eye,
  X,
  Coffee,
  Utensils,
  Apple,
  Cookie,
  Moon,
  RefreshCw,
  Edit3,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { sql } from "../lib/db";
import { formatDate } from "../lib/utils";

export interface RefeicoesDia {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface DiaPlano {
  dia: string;
  refeicoes: RefeicoesDia;
}

export interface PlanoSemanalConteudo {
  plano_semanal: DiaPlano[];
}

export interface PacienteProps {
  id: string;
  nome: string;
  sexo: string | null;
  data_nascimento: string | null;
  peso_inicial: number | null;
  altura: number | null;
  objetivos: string[] | null;
  objetivo_texto: string | null;
  nivel_atividade: string | null;
  atividade_fisica_descricao: string | null;
  patologias: string[] | null;
  restricoes_alimentares: string[] | null;
  alergias: string[] | null;
  medicamentos: string | null;
  suplementos: string | null;
  refeicoes_por_dia: number | null;
  horario_acorda: string | null;
  horario_dorme: string | null;
  litros_agua: number | null;
  observacoes: string | null;
}

export interface PlanoAlimentarItem {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string;
}

interface PlanosAlimentaresSectionProps {
  paciente: PacienteProps;
  planos: PlanoAlimentarItem[];
  onReloadPlanos: () => Promise<void>;
}

const DIAS_SEMANA = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

type RefeicaoKey = "cafe_da_manha" | "lanche_manha" | "almoco" | "lanche_tarde" | "jantar";

const REFEICOES_INFO: Array<{
  key: RefeicaoKey;
  titulo: string;
  subtitulo: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeBg: string;
  badgeText: string;
}> = [
  {
    key: "cafe_da_manha",
    titulo: "Café da Manhã",
    subtitulo: "Primeira refeição do dia para despertar o metabolismo",
    icon: Coffee,
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-700",
  },
  {
    key: "lanche_manha",
    titulo: "Lanche da Manhã",
    subtitulo: "Opções leves para manter os níveis de glicemia estáveis",
    icon: Apple,
    badgeBg: "bg-orange-50 border-orange-200",
    badgeText: "text-orange-700",
  },
  {
    key: "almoco",
    titulo: "Almoço",
    subtitulo: "Refeição principal equilibrada em macros e micronutrientes",
    icon: Utensils,
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-700",
  },
  {
    key: "lanche_tarde",
    titulo: "Lanche da Tarde",
    subtitulo: "Aporte energético saudável para a rotina vespertina",
    icon: Cookie,
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-700",
  },
  {
    key: "jantar",
    titulo: "Jantar",
    subtitulo: "Nutritivo e de fácil digestão para favorecer o descanso noturno",
    icon: Moon,
    badgeBg: "bg-indigo-50 border-indigo-200",
    badgeText: "text-indigo-700",
  },
];

const MENSAGENS_LOADING = [
  "Buscando dados e restrições do paciente...",
  "Analisando objetivos clínicos, patologias e alergias...",
  "IA calculando cardápio semanal personalizado...",
  "Garantindo alimentos típicos brasileiros e variedade...",
  "Formatando 5 opções completas para cada refeição...",
  "Finalizando estruturação do plano alimentar...",
];

export function criarPlanoVazio(): PlanoSemanalConteudo {
  return {
    plano_semanal: DIAS_SEMANA.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ["", "", "", "", ""],
        lanche_manha: ["", "", "", "", ""],
        almoco: ["", "", "", "", ""],
        lanche_tarde: ["", "", "", "", ""],
        jantar: ["", "", "", "", ""],
      },
    })),
  };
}

export const PlanosAlimentaresSection: React.FC<PlanosAlimentaresSectionProps> = ({
  paciente,
  planos,
  onReloadPlanos,
}) => {
  // Estado do plano em edição no formulário
  const [planoEmEdicao, setPlanoEmEdicao] = useState<PlanoSemanalConteudo | null>(null);
  const [diaAtivoIndex, setDiaAtivoIndex] = useState<number>(0);

  // Estados de carregamento e mensagens da IA
  const [gerandoIA, setGerandoIA] = useState<boolean>(false);
  const [mensagemLoadingIndex, setMensagemLoadingIndex] = useState<number>(0);
  const [salvando, setSalvando] = useState<boolean>(false);

  // Mensagens de feedback
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  // Diálogo amigável de erro na IA
  const [dialogoFalhaIA, setDialogoFalhaIA] = useState<{
    aberto: boolean;
    detalhe: string;
  }>({
    aberto: false,
    detalhe: "",
  });

  // Modal para visualizar plano salvo no histórico
  const [planoVisualizando, setPlanoVisualizando] = useState<PlanoAlimentarItem | null>(null);
  const [visualizandoDiaIndex, setVisualizandoDiaIndex] = useState<number>(0);
  const [copiado, setCopiado] = useState<boolean>(false);

  // Timer para mensagens dinâmicas de loading
  const timerLoadingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (gerandoIA) {
      setMensagemLoadingIndex(0);
      timerLoadingRef.current = setInterval(() => {
        setMensagemLoadingIndex((prev) => (prev + 1) % MENSAGENS_LOADING.length);
      }, 2500);
    } else {
      if (timerLoadingRef.current) {
        clearInterval(timerLoadingRef.current);
        timerLoadingRef.current = null;
      }
    }
    return () => {
      if (timerLoadingRef.current) {
        clearInterval(timerLoadingRef.current);
      }
    };
  }, [gerandoIA]);

  // Limpa mensagens após 5 segundos
  useEffect(() => {
    if (sucessoMsg) {
      const t = setTimeout(() => setSucessoMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [sucessoMsg]);

  useEffect(() => {
    if (erroMsg) {
      const t = setTimeout(() => setErroMsg(null), 6000);
      return () => clearTimeout(t);
    }
  }, [erroMsg]);

  // Ação: Gerar Plano com IA
  const handleGerarPlanoIA = async () => {
    if (gerandoIA) return;
    setGerandoIA(true);
    setErroMsg(null);
    setSucessoMsg(null);
    setDialogoFalhaIA({ aberto: false, detalhe: "" });

    try {
      const response = await fetch("/api/gerar-plano", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paciente: {
            id: paciente.id,
            nome: paciente.nome,
            sexo: paciente.sexo,
            data_nascimento: paciente.data_nascimento,
            peso_inicial: paciente.peso_inicial,
            altura: paciente.altura,
            objetivos: paciente.objetivos,
            objetivo_texto: paciente.objetivo_texto,
            nivel_atividade: paciente.nivel_atividade,
            atividade_fisica_descricao: paciente.atividade_fisica_descricao,
            patologias: paciente.patologias,
            restricoes_alimentares: paciente.restricoes_alimentares,
            alergias: paciente.alergias,
            medicamentos: paciente.medicamentos,
            suplementos: paciente.suplementos,
            refeicoes_por_dia: paciente.refeicoes_por_dia,
            horario_acorda: paciente.horario_acorda,
            horario_dorme: paciente.horario_dorme,
            litros_agua: paciente.litros_agua,
            observacoes: paciente.observacoes,
          },
        }),
      });

      let jsonRes: any;
      try {
        jsonRes = await response.json();
      } catch (parseError) {
        throw new Error("Resposta do servidor não pôde ser interpretada como JSON.");
      }

      if (!response.ok || !jsonRes.success || !jsonRes.plano) {
        throw new Error(
          jsonRes.error ||
            "Não foi possível gerar o plano alimentar com IA no momento."
        );
      }

      setPlanoEmEdicao(jsonRes.plano);
      setDiaAtivoIndex(0);
      setSucessoMsg(
        "✨ Plano alimentar semanal gerado com sucesso pela IA! Você pode revisar ou editar cada opção abaixo antes de salvar."
      );
    } catch (err: any) {
      console.error("Erro ao gerar plano via IA:", err);
      setDialogoFalhaIA({
        aberto: true,
        detalhe:
          err?.message ||
          "Ocorreu uma instabilidade momentânea na conexão com a inteligência artificial.",
      });
    } finally {
      setGerandoIA(false);
    }
  };

  // Ação: Iniciar Plano Manual
  const handleCriarPlanoManual = () => {
    setDialogoFalhaIA({ aberto: false, detalhe: "" });
    setPlanoEmEdicao(criarPlanoVazio());
    setDiaAtivoIndex(0);
    setSucessoMsg(
      "Modo de criação manual ativado. Preencha os cardápios para os dias da semana e clique em Salvar."
    );
  };

  // Alteração de um input individual dentro do formulário
  const handleAlterarRefeicao = (
    refeicaoKey: RefeicaoKey,
    opcaoIndex: number,
    novoValor: string
  ) => {
    if (!planoEmEdicao) return;

    setPlanoEmEdicao((prev) => {
      if (!prev) return prev;
      const novoSemanal = [...prev.plano_semanal];
      const diaAtual = { ...novoSemanal[diaAtivoIndex] };
      const refeicoesAtual = { ...diaAtual.refeicoes };
      const opcoesAtual = [...(refeicoesAtual[refeicaoKey] || ["", "", "", "", ""])];

      opcoesAtual[opcaoIndex] = novoValor;
      refeicoesAtual[refeicaoKey] = opcoesAtual;
      diaAtual.refeicoes = refeicoesAtual;
      novoSemanal[diaAtivoIndex] = diaAtual;

      return {
        ...prev,
        plano_semanal: novoSemanal,
      };
    });
  };

  // Persistência no Neon: INSERT INTO planos_alimentares
  const handleSalvarPlano = async () => {
    if (!planoEmEdicao) return;
    if (!paciente.id) {
      setErroMsg("ID do paciente não identificado.");
      return;
    }

    setSalvando(true);
    setErroMsg(null);
    try {
      await sql`
        INSERT INTO planos_alimentares (paciente_id, conteudo)
        VALUES (${paciente.id}, ${JSON.stringify(planoEmEdicao)})
      `;

      await onReloadPlanos();
      setSucessoMsg("Plano alimentar salvo com sucesso no banco de dados!");
      // Limpa a tela de edição voltando à listagem/histórico
      setPlanoEmEdicao(null);
    } catch (err: any) {
      console.error("Erro ao persistir plano no banco de dados:", err);
      setErroMsg(
        err?.message || "Erro ao salvar o plano alimentar no Neon PostgreSQL."
      );
    } finally {
      setSalvando(false);
    }
  };

  // Carregar plano antigo do histórico no editor
  const handleCarregarNoEditor = (item: PlanoAlimentarItem) => {
    try {
      let conteudoObj = item.conteudo;
      if (typeof conteudoObj === "string") {
        conteudoObj = JSON.parse(conteudoObj);
      }
      if (conteudoObj && Array.isArray(conteudoObj.plano_semanal)) {
        setPlanoEmEdicao(conteudoObj);
        setDiaAtivoIndex(0);
        setPlanoVisualizando(null);
        setSucessoMsg("Plano histórico carregado no editor para ajustes.");
        window.scrollTo({ top: 300, behavior: "smooth" });
      } else {
        setErroMsg("Formato do plano histórico incompatível com o editor interativo.");
      }
    } catch (err) {
      setErroMsg("Erro ao carregar o plano alimentar no editor.");
    }
  };

  const diaAtivo = planoEmEdicao?.plano_semanal[diaAtivoIndex];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOASTS / FEEDBACK VISUAL */}
      {/* ========================================================================= */}
      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSucessoMsg(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {erroMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{erroMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErroMsg(null)}
            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOAST/MODAL AMIGÁVEL DE FALHA DA IA */}
      {/* ========================================================================= */}
      {dialogoFalhaIA.aberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Aviso sobre a Inteligência Artificial
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?
              </p>
              {dialogoFalhaIA.detalhe && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 font-mono border border-slate-200 text-left overflow-x-auto max-h-24">
                  {dialogoFalhaIA.detalhe}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogoFalhaIA({ aberto: false, detalhe: "" })}
                className="flex-1 text-xs cursor-pointer order-3 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCriarPlanoManual}
                className="flex-1 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer order-2"
              >
                Criar Plano Manual
              </Button>
              <Button
                type="button"
                onClick={handleGerarPlanoIA}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer order-1 sm:order-3 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CABEÇALHO DA SEÇÃO E AÇÕES PRINCIPAIS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Planos Alimentares do Paciente
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Gere cardápios semanais personalizados com Inteligência Artificial baseados em restrições, patologias e objetivos, ou elabore um plano manual editável.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {!planoEmEdicao && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCriarPlanoManual}
              disabled={gerandoIA}
              className="text-xs border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Plano Manual</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={handleGerarPlanoIA}
            disabled={gerandoIA}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 disabled:cursor-not-allowed text-white flex items-center gap-2 shadow-sm shadow-emerald-600/20 px-5 text-xs font-semibold cursor-pointer"
          >
            {gerandoIA ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                <span>Processando IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ Gerar Plano com IA</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOADING VISUAL COM MENSAGENS DINÂMICAS */}
      {/* ========================================================================= */}
      {gerandoIA && (
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white rounded-3xl border border-emerald-200/80 p-8 sm:p-10 shadow-xs text-center space-y-4 animate-fadeIn">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-2xl bg-emerald-600/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Gerando Plano Alimentar com IA...
            </h3>
            <p className="text-xs text-emerald-700 font-medium min-h-[20px] transition-all duration-300">
              {MENSAGENS_LOADING[mensagemLoadingIndex]}
            </p>
          </div>

          <div className="w-full max-w-xs mx-auto bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full animate-pulse w-3/4" />
          </div>

          <p className="text-[11px] text-slate-400">
            Aguarde alguns segundos enquanto calculamos todas as 5 opções para cada dia da semana.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERFACE DE EDIÇÃO EM ABAS (TABS POR DIA DA SEMANA) */}
      {/* ========================================================================= */}
      {planoEmEdicao && !gerandoIA && (
        <div className="bg-white rounded-3xl border border-emerald-300/80 shadow-md p-6 sm:p-8 space-y-6 animate-fadeIn">
          {/* Barra de título do editor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Editor do Plano Alimentar Semanal
                </h3>
                <p className="text-xs text-slate-400">
                  Navegue pelos dias da semana e ajuste livremente qualquer uma das 5 opções de cada refeição.
                </p>
              </div>
            </div>

            {/* Ações do plano em edição */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Deseja realmente fechar o editor? Alterações não salvas serão perdidas.")) {
                    setPlanoEmEdicao(null);
                  }
                }}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span>Descartar</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSalvarPlano}
                disabled={salvando}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 cursor-pointer shadow-sm shadow-emerald-600/30 flex items-center gap-1.5"
              >
                {salvando ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Plano Alimentar</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Abas dos 7 dias da semana */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-slate-100 scrollbar-none">
            {planoEmEdicao.plano_semanal.map((diaObj, index) => {
              const ativo = diaAtivoIndex === index;
              return (
                <button
                  key={diaObj.dia}
                  type="button"
                  onClick={() => setDiaAtivoIndex(index)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    ativo
                      ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{diaObj.dia}</span>
                </button>
              );
            })}
          </div>

          {/* Conteúdo do dia ativo com as 5 refeições */}
          {diaAtivo && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Cardápio para: <span className="text-emerald-700">{diaAtivo.dia}</span>
                </h4>
                <span className="text-xs text-slate-400">
                  5 opções de substituição por refeição
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {REFEICOES_INFO.map((refeicao) => {
                  const Icon = refeicao.icon;
                  const opcoes = diaAtivo.refeicoes[refeicao.key] || ["", "", "", "", ""];

                  return (
                    <div
                      key={refeicao.key}
                      className="bg-slate-50/60 rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center border ${refeicao.badgeBg} ${refeicao.badgeText}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                              {refeicao.titulo}
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              {refeicao.subtitulo}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 5 Inputs de texto para as 5 opções preenchidas pela IA ou manualmente */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {opcoes.map((opcaoTexto, opcIdx) => (
                          <div
                            key={opcIdx}
                            className="flex items-center gap-2.5 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
                          >
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                              {opcIdx + 1}
                            </span>
                            <Input
                              type="text"
                              value={opcaoTexto}
                              placeholder={`Opção ${opcIdx + 1} de ${refeicao.titulo.toLowerCase()}...`}
                              onChange={(e) =>
                                handleAlterarRefeicao(refeicao.key, opcIdx, e.target.value)
                              }
                              className="border-0 shadow-none focus-visible:ring-0 p-0 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 h-auto"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão de salvar no rodapé da edição */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={handleSalvarPlano}
                  disabled={salvando}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-6 py-2.5 cursor-pointer shadow-sm shadow-emerald-600/30 flex items-center gap-2"
                >
                  {salvando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando alterações no banco...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Plano Alimentar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* HISTÓRICO DE TODOS OS PLANOS SALVOS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Histórico de Planos Salvos ({planos.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Ordem cronológica decrescente
          </span>
        </div>

        {planos.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Nenhum plano alimentar gerado ainda
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Clique no botão "✨ Gerar Plano com IA" acima para criar automaticamente o primeiro plano alimentar baseado no perfil do paciente.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {planos.map((plano, i) => (
              <div
                key={plano.id}
                className="p-5 sm:px-7 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs border border-teal-100 shrink-0">
                    #{planos.length - i}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Plano Alimentar #{planos.length - i}
                    </p>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      Gerado em: {formatDate(plano.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPlanoVisualizando(plano);
                      setVisualizandoDiaIndex(0);
                    }}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-emerald-700 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCarregarNoEditor(plano)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-emerald-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar / Reutilizar</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR CONTEÚDO COMPLETO DO PLANO HISTÓRICO */}
      {/* ========================================================================= */}
      {planoVisualizando && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[85vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Plano Alimentar Salvo</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Criado em: {formatDate(planoVisualizando.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text =
                      typeof planoVisualizando.conteudo === "object"
                        ? JSON.stringify(planoVisualizando.conteudo, null, 2)
                        : String(planoVisualizando.conteudo);
                    navigator.clipboard.writeText(text);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2000);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Copiar JSON do plano"
                >
                  {copiado ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPlanoVisualizando(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Se o plano salvo possui a estrutura interativa plano_semanal */}
            {planoVisualizando.conteudo &&
            Array.isArray(planoVisualizando.conteudo.plano_semanal) ? (
              <div className="space-y-5">
                {/* Abas dos dias no modal */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 scrollbar-none">
                  {planoVisualizando.conteudo.plano_semanal.map(
                    (diaItem: any, idx: number) => {
                      const ativo = visualizandoDiaIndex === idx;
                      return (
                        <button
                          key={diaItem.dia || idx}
                          type="button"
                          onClick={() => setVisualizandoDiaIndex(idx)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            ativo
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {diaItem.dia}
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Refeições do dia selecionado */}
                {(() => {
                  const diaObj =
                    planoVisualizando.conteudo.plano_semanal[visualizandoDiaIndex];
                  if (!diaObj) return null;

                  return (
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <span>Cardápio: {diaObj.dia}</span>
                      </div>

                      <div className="space-y-4">
                        {REFEICOES_INFO.map((refeicao) => {
                          const Icon = refeicao.icon;
                          const opcoes: string[] =
                            diaObj.refeicoes?.[refeicao.key] || [];

                          return (
                            <div
                              key={refeicao.key}
                              className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2.5"
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center border ${refeicao.badgeBg} ${refeicao.badgeText}`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span>{refeicao.titulo}</span>
                              </div>

                              <ul className="space-y-1.5 pl-2">
                                {opcoes.map((opcaoTexto: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-slate-700 flex items-start gap-2"
                                  >
                                    <span className="w-4 h-4 rounded-md bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <span>{opcaoTexto}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              // Fallback caso seja JSON bruto ou texto
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-mono text-xs text-slate-800 whitespace-pre-wrap overflow-x-auto max-h-96">
                {typeof planoVisualizando.conteudo === "object"
                  ? JSON.stringify(planoVisualizando.conteudo, null, 2)
                  : String(planoVisualizando.conteudo)}
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCarregarNoEditor(planoVisualizando)}
                className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Carregar no Editor</span>
              </Button>

              <Button
                type="button"
                onClick={() => setPlanoVisualizando(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-5 cursor-pointer"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
