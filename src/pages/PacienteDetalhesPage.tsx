import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  Scale,
  Ruler,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Clock,
  CalendarDays,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { sql } from "../lib/db";
import { formatDate } from "../lib/utils";
import { PlanosAlimentaresSection } from "../components/PlanosAlimentaresSection";

// --- Opções padrão das abas clínicas ---
const OBJETIVOS_OPTIONS = [
  "Emagrecer",
  "Ganhar massa",
  "Controlar diabetes",
  "Saúde geral",
  "Performance esportiva",
  "Reeducação alimentar",
];

const NIVEIS_ATIVIDADE = [
  "Sedentário",
  "Levemente ativo",
  "Moderadamente ativo",
  "Muito ativo",
  "Extremamente ativo",
];

const PATOLOGIAS_OPTIONS = [
  "Diabetes",
  "Hipertensão",
  "Hipotireoidismo",
  "Hipertireoidismo",
  "Síndrome do ovário policístico",
  "Doença celíaca",
  "Colesterol alto",
];

const RESTRICOES_OPTIONS = [
  "Lactose",
  "Glúten",
  "Açúcar",
  "Carne vermelha",
  "Frutos do mar",
];

const ALERGIAS_OPTIONS = [
  "Amendoim",
  "Leite",
  "Ovo",
  "Soja",
  "Trigo",
  "Frutos do mar",
];

interface PacienteData {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento: string | null;
  sexo: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  peso_inicial: number | null;
  altura: number | null;
  objetivos: string[] | null;
  objetivo_texto: string | null;
  nivel_atividade: string | null;
  patologias: string[] | null;
  restricoes_alimentares: string[] | null;
  alergias: string[] | null;
  medicamentos: string | null;
  suplementos: string | null;
  refeicoes_por_dia: number | null;
  horario_acorda: string | null;
  horario_dorme: string | null;
  litros_agua: number | null;
  atividade_fisica: boolean | null;
  atividade_fisica_descricao: string | null;
  observacoes: string | null;
  created_at: string;
}

interface ConsultaItem {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso: number | null;
  cintura: number | null;
  quadril: number | null;
  percentual_gordura: number | null;
  observacoes: string | null;
  proximo_retorno: string | null;
  created_at: string;
}

interface PlanoAlimentarItem {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string;
}

export const PacienteDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation();

  // Estados principais
  const [paciente, setPaciente] = useState<PacienteData | null>(null);
  const [consultas, setConsultas] = useState<ConsultaItem[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentarItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Seção principal ativa: "dados" | "consultas" | "planos"
  const [mainSection, setMainSection] = useState<"dados" | "consultas" | "planos">("dados");

  // Sub-aba ativa na Seção 1 (Dados do Paciente): "pessoal" | "clinico" | "habitos"
  const [subTab, setSubTab] = useState<"pessoal" | "clinico" | "habitos">("pessoal");

  // Formulário editável dos Dados do Paciente
  const [editNome, setEditNome] = useState("");
  const [editDataNascimento, setEditDataNascimento] = useState("");
  const [editSexo, setEditSexo] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPesoInicial, setEditPesoInicial] = useState("");
  const [editAltura, setEditAltura] = useState("");
  const [editObjetivos, setEditObjetivos] = useState<string[]>([]);
  const [editObjetivoTexto, setEditObjetivoTexto] = useState("");
  const [editNivelAtividade, setEditNivelAtividade] = useState("");
  const [editPatologias, setEditPatologias] = useState<string[]>([]);
  const [patologiaExtra, setPatologiaExtra] = useState("");
  const [editRestricoes, setEditRestricoes] = useState<string[]>([]);
  const [restricaoExtra, setRestricaoExtra] = useState("");
  const [editAlergias, setEditAlergias] = useState<string[]>([]);
  const [alergiaExtra, setAlergiaExtra] = useState("");
  const [editMedicamentos, setEditMedicamentos] = useState("");
  const [editSuplementos, setEditSuplementos] = useState("");
  const [editRefeicoesPorDia, setEditRefeicoesPorDia] = useState("");
  const [editHorarioAcorda, setEditHorarioAcorda] = useState("");
  const [editHorarioDorme, setEditHorarioDorme] = useState("");
  const [editLitrosAgua, setEditLitrosAgua] = useState("");
  const [editAtividadeFisica, setEditAtividadeFisica] = useState<boolean | null>(null);
  const [editAtividadeFisicaDescricao, setEditAtividadeFisicaDescricao] = useState("");
  const [editObservacoes, setEditObservacoes] = useState("");

  // Feedback de salvamento
  const [savingPaciente, setSavingPaciente] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    (location.state as any)?.message || null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal de Nova Consulta
  const [modalConsultaOpen, setModalConsultaOpen] = useState(false);
  const [novaDataConsulta, setNovaDataConsulta] = useState(() => new Date().toISOString().split("T")[0]);
  const [novoPeso, setNovoPeso] = useState("");
  const [novaCintura, setNovaCintura] = useState("");
  const [novoQuadril, setNovoQuadril] = useState("");
  const [novoPercentualGordura, setNovoPercentualGordura] = useState("");
  const [novasObservacoes, setNovasObservacoes] = useState("");
  const [novoProximoRetorno, setNovoProximoRetorno] = useState("");
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [consultaError, setConsultaError] = useState<string | null>(null);

  // Modal para ver plano alimentar completo
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoAlimentarItem | null>(null);

  // Carregar dados iniciais em tempo real
  const carregarTudo = async () => {
    if (!id || !user?.id) return;
    try {
      // 1. Paciente
      const resPaciente = await sql`
        SELECT * FROM pacientes 
        WHERE id = ${id} AND nutricionista_id = ${user.id}
        LIMIT 1
      `;
      if (resPaciente && resPaciente.length > 0) {
        const p = resPaciente[0] as PacienteData;
        setPaciente(p);
        preencherFormulario(p);
      } else {
        setPaciente(null);
      }

      // 2. Consultas
      const resConsultas = await sql`
        SELECT * FROM consultas
        WHERE paciente_id = ${id}
        ORDER BY data_consulta DESC, created_at DESC
      `;
      setConsultas(resConsultas as ConsultaItem[]);

      // 3. Planos Alimentares
      const resPlanos = await sql`
        SELECT * FROM planos_alimentares
        WHERE paciente_id = ${id}
        ORDER BY created_at DESC
      `;
      setPlanos(resPlanos as PlanoAlimentarItem[]);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setErrorMsg("Erro ao conectar com o banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, [id, user]);

  // Preenche o formulário com dados do paciente para edição direta
  const preencherFormulario = (p: PacienteData) => {
    setEditNome(p.nome || "");
    setEditDataNascimento(p.data_nascimento ? p.data_nascimento.split("T")[0] : "");
    setEditSexo(p.sexo || "");
    setEditTelefone(p.telefone || "");
    setEditWhatsapp(p.whatsapp || "");
    setEditEmail(p.email || "");
    setEditPesoInicial(p.peso_inicial !== null ? String(p.peso_inicial) : "");
    setEditAltura(p.altura !== null ? String(p.altura) : "");
    setEditObjetivos(p.objetivos || []);
    setEditObjetivoTexto(p.objetivo_texto || "");
    setEditNivelAtividade(p.nivel_atividade || "");
    setEditPatologias(p.patologias || []);
    setEditRestricoes(p.restricoes_alimentares || []);
    setEditAlergias(p.alergias || []);
    setEditMedicamentos(p.medicamentos || "");
    setEditSuplementos(p.suplementos || "");
    setEditRefeicoesPorDia(p.refeicoes_por_dia !== null ? String(p.refeicoes_por_dia) : "");
    setEditHorarioAcorda(p.horario_acorda || "");
    setEditHorarioDorme(p.horario_dorme || "");
    setEditLitrosAgua(p.litros_agua !== null ? String(p.litros_agua) : "");
    setEditAtividadeFisica(p.atividade_fisica);
    setEditAtividadeFisicaDescricao(p.atividade_fisica_descricao || "");
    setEditObservacoes(p.observacoes || "");
  };

  // Cálculo da Idade
  const idadeCalculada = useMemo(() => {
    if (!editDataNascimento) return null;
    const nasc = new Date(editDataNascimento);
    if (isNaN(nasc.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade >= 0 ? idade : null;
  }, [editDataNascimento]);

  // Cálculo de IMC
  const imcCalculado = useMemo(() => {
    const p = parseFloat(editPesoInicial.replace(",", "."));
    const a = parseFloat(editAltura.replace(",", "."));
    if (!p || !a || p <= 0 || a <= 0) return null;
    const alturaMetros = a > 3 ? a / 100 : a;
    const imc = p / (alturaMetros * alturaMetros);
    if (isNaN(imc) || !isFinite(imc)) return null;

    let classificacao = "";
    let cor = "text-slate-700";
    if (imc < 18.5) {
      classificacao = "Abaixo do peso";
      cor = "text-amber-600";
    } else if (imc < 24.9) {
      classificacao = "Peso normal";
      cor = "text-emerald-600";
    } else if (imc < 29.9) {
      classificacao = "Sobrepeso";
      cor = "text-amber-600";
    } else if (imc < 34.9) {
      classificacao = "Obesidade Grau I";
      cor = "text-orange-600";
    } else {
      classificacao = "Obesidade Grau II/III";
      cor = "text-red-600";
    }

    return {
      valor: imc.toFixed(2),
      classificacao,
      cor,
    };
  }, [editPesoInicial, editAltura]);

  // Helper formatação de telefone
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Helper conversão de hora
  const formatHourString = (raw: string) => {
    if (!raw.trim()) return "";
    if (raw.includes(":")) {
      const parts = raw.split(":");
      const h = parts[0].padStart(2, "0");
      const m = (parts[1] || "00").padEnd(2, "0");
      return `${h}:${m}`;
    }
    const cleanDigits = raw.replace(/\D/g, "");
    if (!cleanDigits) return raw;
    if (cleanDigits.length <= 2) return `${cleanDigits.padStart(2, "0")}:00`;
    if (cleanDigits.length === 3) return `${cleanDigits[0].padStart(2, "0")}:${cleanDigits.slice(1, 3)}`;
    return `${cleanDigits.slice(0, 2)}:${cleanDigits.slice(2, 4)}`;
  };

  // Toggle de itens de array
  const toggleArrayItem = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (item === "Nenhum") {
      setList(list.includes("Nenhum") ? [] : ["Nenhum"]);
      return;
    }
    const withoutNenhum = list.filter((i) => i !== "Nenhum");
    if (withoutNenhum.includes(item)) {
      setList(withoutNenhum.filter((i) => i !== item));
    } else {
      setList([...withoutNenhum, item]);
    }
  };

  // Adicionar item customizado
  const handleAddCustom = (
    val: string,
    setVal: (v: string) => void,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const withoutNenhum = list.filter((i) => i !== "Nenhum");
    if (!withoutNenhum.includes(trimmed)) {
      setList([...withoutNenhum, trimmed]);
    }
    setVal("");
  };

  // Salvar Alterações dos Dados do Paciente (Seção 1)
  const handleSalvarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user?.id) return;
    if (!editNome.trim()) {
      setErrorMsg("O nome completo do paciente não pode ficar vazio.");
      return;
    }

    setSavingPaciente(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const pesoNum = editPesoInicial ? parseFloat(editPesoInicial.replace(",", ".")) : null;
      const alturaNum = editAltura ? parseFloat(editAltura.replace(",", ".")) : null;
      const refeicoesNum = editRefeicoesPorDia ? parseInt(editRefeicoesPorDia, 10) : null;
      const litrosNum = editLitrosAgua ? parseFloat(editLitrosAgua.replace(",", ".")) : null;

      const horarioAcordaFmt = editHorarioAcorda ? formatHourString(editHorarioAcorda) : null;
      const horarioDormeFmt = editHorarioDorme ? formatHourString(editHorarioDorme) : null;

      const res = await sql`
        UPDATE pacientes
        SET
          nome = ${editNome.trim()},
          data_nascimento = ${editDataNascimento || null},
          sexo = ${editSexo || null},
          telefone = ${editTelefone || null},
          whatsapp = ${editWhatsapp || null},
          email = ${editEmail.trim() || null},
          peso_inicial = ${pesoNum},
          altura = ${alturaNum},
          objetivos = ${editObjetivos},
          objetivo_texto = ${editObjetivoTexto.trim() || null},
          nivel_atividade = ${editNivelAtividade || null},
          patologias = ${editPatologias},
          restricoes_alimentares = ${editRestricoes},
          alergias = ${editAlergias},
          medicamentos = ${editMedicamentos.trim() || null},
          suplementos = ${editSuplementos.trim() || null},
          refeicoes_por_dia = ${refeicoesNum},
          horario_acorda = ${horarioAcordaFmt},
          horario_dorme = ${horarioDormeFmt},
          litros_agua = ${litrosNum},
          atividade_fisica = ${editAtividadeFisica},
          atividade_fisica_descricao = ${editAtividadeFisica ? (editAtividadeFisicaDescricao.trim() || null) : null},
          observacoes = ${editObservacoes.trim() || null}
        WHERE id = ${id} AND nutricionista_id = ${user.id}
        RETURNING *
      `;

      if (res && res.length > 0) {
        setPaciente(res[0] as PacienteData);
        setSuccessMsg("Alterações do paciente salvas com sucesso no Neon!");
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      console.error("Erro ao atualizar paciente:", err);
      setErrorMsg("Erro ao salvar alterações no Neon. Verifique os dados.");
    } finally {
      setSavingPaciente(false);
    }
  };

  // Salvar Nova Consulta (Seção 2)
  const handleSalvarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user?.id) return;
    if (!novaDataConsulta) {
      setConsultaError("Selecione a data da consulta.");
      return;
    }
    if (!novoPeso) {
      setConsultaError("Informe o peso atual nesta consulta.");
      return;
    }

    setSavingConsulta(true);
    setConsultaError(null);

    try {
      const pesoNum = parseFloat(novoPeso.replace(",", "."));
      const cinturaNum = novaCintura ? parseFloat(novaCintura.replace(",", ".")) : null;
      const quadrilNum = novoQuadril ? parseFloat(novoQuadril.replace(",", ".")) : null;
      const gorduraNum = novoPercentualGordura ? parseFloat(novoPercentualGordura.replace(",", ".")) : null;

      await sql`
        INSERT INTO consultas (
          paciente_id,
          data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          proximo_retorno
        ) VALUES (
          ${id},
          ${novaDataConsulta},
          ${pesoNum},
          ${cinturaNum},
          ${quadrilNum},
          ${gorduraNum},
          ${novasObservacoes.trim() || null},
          ${novoProximoRetorno || null}
        )
      `;

      // Recarrega consultas do banco
      const resConsultas = await sql`
        SELECT * FROM consultas
        WHERE paciente_id = ${id}
        ORDER BY data_consulta DESC, created_at DESC
      `;
      setConsultas(resConsultas as ConsultaItem[]);

      // Limpar formulário e fechar modal
      setModalConsultaOpen(false);
      setNovoPeso("");
      setNovaCintura("");
      setNovoQuadril("");
      setNovoPercentualGordura("");
      setNovasObservacoes("");
      setNovoProximoRetorno("");
      setSuccessMsg("Consulta salva com sucesso!");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error("Erro ao salvar consulta:", err);
      setConsultaError("Erro ao registrar consulta no Neon.");
    } finally {
      setSavingConsulta(false);
    }
  };

  // Preparar dados do gráfico de evolução de peso (ordem cronológica crescente: mais antiga -> mais recente)
  const consultasCronologicas = useMemo(() => {
    return [...consultas]
      .filter((c) => c.peso !== null && !isNaN(Number(c.peso)))
      .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime());
  }, [consultas]);

  // Variação de peso entre a primeira e a última consulta
  const variacaoPeso = useMemo(() => {
    if (consultasCronologicas.length < 2) return null;
    const primeira = Number(consultasCronologicas[0].peso);
    const ultima = Number(consultasCronologicas[consultasCronologicas.length - 1].peso);
    const diff = ultima - primeira;
    return {
      diff: diff.toFixed(1),
      isDown: diff < 0,
      isUp: diff > 0,
    };
  }, [consultasCronologicas]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl pb-12">
        {/* Top Header / Voltar */}
        <div className="flex items-center justify-between">
          <Link to="/pacientes">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 bg-white shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar aos Pacientes</span>
            </Button>
          </Link>
        </div>

        {/* Mensagens de Sucesso / Erro */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-xs text-emerald-700 hover:underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs text-red-700 hover:underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 space-y-4">
            <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        ) : !paciente ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Paciente não encontrado
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verifique se o paciente pertence ao seu cadastro.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cabeçalho do Perfil com Avatar e Resumo */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-2xl flex items-center justify-center uppercase shadow-md shadow-emerald-500/20 shrink-0">
                  {paciente.nome ? paciente.nome.slice(0, 2) : "PA"}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {paciente.nome}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-500">
                    {paciente.sexo && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                        {paciente.sexo}
                      </span>
                    )}
                    {paciente.data_nascimento && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(paciente.data_nascimento)}
                        {idadeCalculada !== null && ` (${idadeCalculada} anos)`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-xs text-slate-600 sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
                {paciente.whatsapp && (
                  <span className="flex items-center sm:justify-end gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>WhatsApp:</strong> {paciente.whatsapp}
                  </span>
                )}
                {paciente.telefone && !paciente.whatsapp && (
                  <span className="flex items-center sm:justify-end gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <strong>Telefone:</strong> {paciente.telefone}
                  </span>
                )}
                {paciente.email && (
                  <span className="flex items-center sm:justify-end gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {paciente.email}
                  </span>
                )}
              </div>
            </div>

            {/* Menu com as 3 seções solicitadas no Prompt 5:
                1. Dados do Paciente | 2. Consultas | 3. Planos Alimentares */}
            <div className="flex border-b border-slate-200/90 gap-2 sm:gap-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setMainSection("dados")}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  mainSection === "dados"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <User className="w-4 h-4" />
                <span>1. Dados do Paciente</span>
              </button>

              <button
                type="button"
                onClick={() => setMainSection("consultas")}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  mainSection === "consultas"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>2. Consultas</span>
                {consultas.length > 0 && (
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full ml-0.5">
                    {consultas.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMainSection("planos")}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  mainSection === "planos"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>3. Planos Alimentares</span>
                {planos.length > 0 && (
                  <span className="text-[11px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.2 rounded-full ml-0.5">
                    {planos.length}
                  </span>
                )}
              </button>
            </div>

            {/* ========================================================================= */}
            {/* SEÇÃO 1 — DADOS DO PACIENTE (Com as 3 abas editáveis e botão Salvar) */}
            {/* ========================================================================= */}
            {mainSection === "dados" && (
              <form onSubmit={handleSalvarPaciente} className="space-y-6">
                {/* Sub-abas: Pessoal, Clínico e Hábitos */}
                <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-fit gap-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSubTab("pessoal")}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                      subTab === "pessoal"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Pessoal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab("clinico")}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                      subTab === "clinico"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Clínico
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab("habitos")}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                      subTab === "habitos"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Hábitos
                  </button>
                </div>

                {/* Sub-aba Pessoal */}
                {subTab === "pessoal" && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-800">
                        Dados Pessoais e Contato (Editáveis)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Edite diretamente os campos abaixo e clique em "Salvar alterações".
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Nome Completo <span className="text-emerald-600 font-bold">*</span>
                        </label>
                        <Input
                          type="text"
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Data de Nascimento
                        </label>
                        <Input
                          type="date"
                          value={editDataNascimento}
                          onChange={(e) => setEditDataNascimento(e.target.value)}
                        />
                        {idadeCalculada !== null && (
                          <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-1">
                            Idade: {idadeCalculada} {idadeCalculada === 1 ? "ano" : "anos"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Sexo
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {["Feminino", "Masculino", "Outro"].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setEditSexo(s)}
                              className={`h-11 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                editSexo === s
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Telefone
                        </label>
                        <Input
                          type="tel"
                          value={editTelefone}
                          onChange={(e) => setEditTelefone(formatPhone(e.target.value))}
                          icon={<Phone className="w-4 h-4" />}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          WhatsApp
                        </label>
                        <Input
                          type="tel"
                          value={editWhatsapp}
                          onChange={(e) => setEditWhatsapp(formatPhone(e.target.value))}
                          icon={<Phone className="w-4 h-4 text-emerald-600" />}
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          icon={<Mail className="w-4 h-4" />}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-aba Clínico */}
                {subTab === "clinico" && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-8">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-800">
                        Dados Clínicos e Avaliação Antropométrica (Editáveis)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Métricas corporais, objetivos e histórico patológico.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Peso Inicial (kg)
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.1"
                            value={editPesoInicial}
                            onChange={(e) => setEditPesoInicial(e.target.value)}
                            icon={<Scale className="w-4 h-4" />}
                            className="pr-12"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                            kg
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Altura (cm)
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            value={editAltura}
                            onChange={(e) => setEditAltura(e.target.value)}
                            icon={<Ruler className="w-4 h-4" />}
                            className="pr-12"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                            cm
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          IMC Calculado
                        </label>
                        <div className="h-11 rounded-xl bg-slate-50 border border-slate-200 px-3.5 flex items-center justify-between">
                          {imcCalculado ? (
                            <>
                              <span className="font-bold text-slate-900 text-sm">
                                {imcCalculado.valor}{" "}
                                <span className="text-xs text-slate-400 font-normal">kg/m²</span>
                              </span>
                              <span className={`text-xs font-semibold ${imcCalculado.cor}`}>
                                {imcCalculado.classificacao}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">Preencha peso e altura</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Objetivos */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Objetivos (Múltipla Escolha)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {OBJETIVOS_OPTIONS.map((obj) => {
                          const isSelected = editObjetivos.includes(obj);
                          return (
                            <button
                              key={obj}
                              type="button"
                              onClick={() => toggleArrayItem(obj, editObjetivos, setEditObjetivos)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              {obj}
                            </button>
                          );
                        })}
                      </div>
                      <Input
                        type="text"
                        placeholder="Texto adicional do objetivo..."
                        value={editObjetivoTexto}
                        onChange={(e) => setEditObjetivoTexto(e.target.value)}
                      />
                    </div>

                    {/* Nível de Atividade */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Nível de Atividade Física
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {NIVEIS_ATIVIDADE.map((nivel) => (
                          <button
                            key={nivel}
                            type="button"
                            onClick={() => setEditNivelAtividade(nivel)}
                            className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                              editNivelAtividade === nivel
                                ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {nivel}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Patologias */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Patologias ou Condições de Saúde
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleArrayItem("Nenhum", editPatologias, setEditPatologias)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            editPatologias.includes("Nenhum")
                              ? "bg-slate-800 border-slate-800 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          Nenhum
                        </button>
                        {PATOLOGIAS_OPTIONS.map((pat) => (
                          <button
                            key={pat}
                            type="button"
                            onClick={() => toggleArrayItem(pat, editPatologias, setEditPatologias)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              editPatologias.includes(pat)
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {pat}
                          </button>
                        ))}
                      </div>

                      {/* Custom Tags */}
                      {editPatologias.filter((p) => !PATOLOGIAS_OPTIONS.includes(p) && p !== "Nenhum").length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {editPatologias
                            .filter((p) => !PATOLOGIAS_OPTIONS.includes(p) && p !== "Nenhum")
                            .map((item) => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-medium"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => setEditPatologias(editPatologias.filter((i) => i !== item))}
                                  className="hover:text-emerald-950 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Input
                          type="text"
                          placeholder="Adicionar patologia..."
                          value={patologiaExtra}
                          onChange={(e) => setPatologiaExtra(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustom(patologiaExtra, setPatologiaExtra, editPatologias, setEditPatologias);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddCustom(patologiaExtra, setPatologiaExtra, editPatologias, setEditPatologias)}
                          className="px-3"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                    </div>

                    {/* Restrições Alimentares */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Restrições Alimentares
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleArrayItem("Nenhum", editRestricoes, setEditRestricoes)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            editRestricoes.includes("Nenhum")
                              ? "bg-slate-800 border-slate-800 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          Nenhum
                        </button>
                        {RESTRICOES_OPTIONS.map((rest) => (
                          <button
                            key={rest}
                            type="button"
                            onClick={() => toggleArrayItem(rest, editRestricoes, setEditRestricoes)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              editRestricoes.includes(rest)
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {rest}
                          </button>
                        ))}
                      </div>

                      {editRestricoes.filter((r) => !RESTRICOES_OPTIONS.includes(r) && r !== "Nenhum").length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {editRestricoes
                            .filter((r) => !RESTRICOES_OPTIONS.includes(r) && r !== "Nenhum")
                            .map((item) => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 text-xs font-medium"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => setEditRestricoes(editRestricoes.filter((i) => i !== item))}
                                  className="hover:text-teal-950 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Input
                          type="text"
                          placeholder="Adicionar restrição..."
                          value={restricaoExtra}
                          onChange={(e) => setRestricaoExtra(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustom(restricaoExtra, setRestricaoExtra, editRestricoes, setEditRestricoes);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddCustom(restricaoExtra, setRestricaoExtra, editRestricoes, setEditRestricoes)}
                          className="px-3"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                    </div>

                    {/* Alergias Alimentares */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Alergias Alimentares
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleArrayItem("Nenhum", editAlergias, setEditAlergias)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            editAlergias.includes("Nenhum")
                              ? "bg-slate-800 border-slate-800 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          Nenhum
                        </button>
                        {ALERGIAS_OPTIONS.map((alg) => (
                          <button
                            key={alg}
                            type="button"
                            onClick={() => toggleArrayItem(alg, editAlergias, setEditAlergias)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              editAlergias.includes(alg)
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {alg}
                          </button>
                        ))}
                      </div>

                      {editAlergias.filter((a) => !ALERGIAS_OPTIONS.includes(a) && a !== "Nenhum").length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {editAlergias
                            .filter((a) => !ALERGIAS_OPTIONS.includes(a) && a !== "Nenhum")
                            .map((item) => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-medium"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => setEditAlergias(editAlergias.filter((i) => i !== item))}
                                  className="hover:text-amber-950 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Input
                          type="text"
                          placeholder="Adicionar alergia..."
                          value={alergiaExtra}
                          onChange={(e) => setAlergiaExtra(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustom(alergiaExtra, setAlergiaExtra, editAlergias, setEditAlergias);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddCustom(alergiaExtra, setAlergiaExtra, editAlergias, setEditAlergias)}
                          className="px-3"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                    </div>

                    {/* Medicamentos e Suplementos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Medicamentos Contínuos (Texto Livre)
                        </label>
                        <textarea
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                          value={editMedicamentos}
                          onChange={(e) => setEditMedicamentos(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Suplementos em Uso (Texto Livre)
                        </label>
                        <textarea
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                          value={editSuplementos}
                          onChange={(e) => setEditSuplementos(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-aba Hábitos */}
                {subTab === "habitos" && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-800">
                        Rotina e Hábitos Diários (Editáveis)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Horários, hábitos hídricos e atividades esportivas.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Quantas Refeições Faz por Dia
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={editRefeicoesPorDia}
                          onChange={(e) => setEditRefeicoesPorDia(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Quantidade de Água por Dia (litros)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={editLitrosAgua}
                          onChange={(e) => setEditLitrosAgua(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Horário que Acorda
                        </label>
                        <Input
                          type="text"
                          placeholder="Ex: 06:00"
                          value={editHorarioAcorda}
                          onChange={(e) => setEditHorarioAcorda(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Horário que Dorme
                        </label>
                        <Input
                          type="text"
                          placeholder="Ex: 23:00"
                          value={editHorarioDorme}
                          onChange={(e) => setEditHorarioDorme(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Atividade Física */}
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Pratica Atividade Física?
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setEditAtividadeFisica(true)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            editAtividadeFisica === true
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditAtividadeFisica(false);
                            setEditAtividadeFisicaDescricao("");
                          }}
                          className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            editAtividadeFisica === false
                              ? "bg-slate-100 border-slate-400 text-slate-800"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Não
                        </button>
                      </div>

                      {editAtividadeFisica === true && (
                        <div className="pt-1 space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Qual atividade e frequência semanal?
                          </label>
                          <Input
                            type="text"
                            value={editAtividadeFisicaDescricao}
                            onChange={(e) => setEditAtividadeFisicaDescricao(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Observações Gerais */}
                    <div className="space-y-1.5 pt-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Observações Gerais (Texto Livre)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                        value={editObservacoes}
                        onChange={(e) => setEditObservacoes(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Botão Salvar Alterações */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingPaciente}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm shadow-emerald-600/20 px-6 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingPaciente ? "Salvando alterações..." : "Salvar alterações"}</span>
                  </Button>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* SEÇÃO 2 — CONSULTAS (Gráfico de peso, lista cronológica e Nova Consulta) */}
            {/* ========================================================================= */}
            {mainSection === "consultas" && (
              <div className="space-y-6">
                {/* Header da Seção de Consultas + Botão Nova Consulta */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Acompanhamento Clínico & Consultas
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Registre pesagens, medidas e histórico de evolução do paciente.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      setNovaDataConsulta(new Date().toISOString().split("T")[0]);
                      setModalConsultaOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Consulta</span>
                  </Button>
                </div>

                {/* Card de Destaque: Gráfico de Evolução de Peso */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Scale className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Gráfico de Evolução de Peso
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Histórico de pesagem registrada em cada consulta ao longo do tratamento.
                        </p>
                      </div>
                    </div>

                    {variacaoPeso && (
                      <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 self-start sm:self-auto">
                        <span className="text-slate-500">Variação Total:</span>
                        <span
                          className={`flex items-center gap-1 ${
                            variacaoPeso.isDown
                              ? "text-emerald-600"
                              : variacaoPeso.isUp
                              ? "text-amber-600"
                              : "text-slate-700"
                          }`}
                        >
                          {variacaoPeso.isDown ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                          {variacaoPeso.diff} kg
                        </span>
                      </div>
                    )}
                  </div>

                  {consultasCronologicas.length === 0 ? (
                    <div className="py-12 text-center">
                      <Scale className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">
                        Nenhuma consulta registrada ainda
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Clique em "Nova Consulta" para registrar o primeiro atendimento e acompanhar a evolução.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Gráfico SVG Responsivo */}
                      <div className="w-full h-64 sm:h-72 relative pt-4 pb-2">
                        {(() => {
                          const pontos = consultasCronologicas;
                          const pesos = pontos.map((p) => Number(p.peso));
                          const minPeso = Math.floor(Math.min(...pesos) - 2);
                          const maxPeso = Math.ceil(Math.max(...pesos) + 2);
                          const range = maxPeso - minPeso || 1;

                          const width = 800;
                          const height = 220;
                          const paddingX = 50;
                          const paddingY = 30;

                          const chartWidth = width - paddingX * 2;
                          const chartHeight = height - paddingY * 2;

                          // Coordenadas dos pontos
                          const coords = pontos.map((p, index) => {
                            const x =
                              pontos.length === 1
                                ? width / 2
                                : paddingX + (index / (pontos.length - 1)) * chartWidth;
                            const y =
                              height -
                              paddingY -
                              ((Number(p.peso) - minPeso) / range) * chartHeight;
                            return { x, y, peso: Number(p.peso), data: p.data_consulta };
                          });

                          const pathD = coords.reduce(
                            (acc, c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
                            ""
                          );

                          const areaD =
                            coords.length > 1
                              ? `${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`
                              : "";

                          return (
                            <svg
                              viewBox={`0 0 ${width} ${height}`}
                              className="w-full h-full overflow-visible"
                            >
                              <defs>
                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>

                              {/* Linhas de grade horizontais */}
                              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                                const y = height - paddingY - pct * chartHeight;
                                const val = (minPeso + pct * range).toFixed(1);
                                return (
                                  <g key={i}>
                                    <line
                                      x1={paddingX - 10}
                                      y1={y}
                                      x2={width - paddingX + 10}
                                      y2={y}
                                      stroke="#f1f5f9"
                                      strokeWidth="1"
                                      strokeDasharray="4 4"
                                    />
                                    <text
                                      x={paddingX - 15}
                                      y={y + 3}
                                      textAnchor="end"
                                      fontSize="10"
                                      fill="#94a3b8"
                                      fontFamily="sans-serif"
                                    >
                                      {val} kg
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Área sombreada sob a curva */}
                              {areaD && <path d={areaD} fill="url(#areaGradient)" />}

                              {/* Linha principal */}
                              {coords.length > 1 && (
                                <path
                                  d={pathD}
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              )}

                              {/* Pontos clicáveis / marcadores */}
                              {coords.map((c, i) => (
                                <g key={i} className="group">
                                  <circle
                                    cx={c.x}
                                    cy={c.y}
                                    r="6"
                                    fill="#ffffff"
                                    stroke="#10b981"
                                    strokeWidth="3"
                                    className="transition-transform group-hover:scale-125"
                                  />
                                  <text
                                    x={c.x}
                                    y={c.y - 12}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fontWeight="bold"
                                    fill="#0f172a"
                                    fontFamily="sans-serif"
                                  >
                                    {c.peso} kg
                                  </text>
                                  <text
                                    x={c.x}
                                    y={height - paddingY + 16}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#64748b"
                                    fontFamily="sans-serif"
                                  >
                                    {formatDate(c.data)}
                                  </text>
                                </g>
                              ))}
                            </svg>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Consultas em ordem cronológica decrescente */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Histórico de Consultas ({consultas.length})
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Em ordem cronológica decrescente (da mais recente para a mais antiga).
                      </p>
                    </div>
                  </div>

                  {consultas.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Nenhuma consulta registrada para este paciente.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {consultas.map((c, index) => (
                        <div
                          key={c.id}
                          className="p-5 sm:px-7 hover:bg-slate-50/60 transition-colors space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-100">
                                #{consultas.length - index}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                                  {formatDate(c.data_consulta)}
                                </span>
                              </div>
                            </div>

                            {c.proximo_retorno && (
                              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl self-start sm:self-auto border border-teal-200/70">
                                <Clock className="w-3.5 h-3.5 text-teal-600" />
                                <span>Próximo Retorno: {formatDate(c.proximo_retorno)}</span>
                              </div>
                            )}
                          </div>

                          {/* Métricas corporais da consulta */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Peso
                              </span>
                              <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                                {c.peso ? `${c.peso} kg` : "-"}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Cintura
                              </span>
                              <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                                {c.cintura ? `${c.cintura} cm` : "-"}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Quadril
                              </span>
                              <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                                {c.quadril ? `${c.quadril} cm` : "-"}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                % Gordura
                              </span>
                              <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                                {c.percentual_gordura ? `${c.percentual_gordura}%` : "-"}
                              </span>
                            </div>
                          </div>

                          {/* Observações da consulta */}
                          {c.observacoes && (
                            <div className="pt-1">
                              <p className="text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                                <strong className="text-slate-700">Obs:</strong> {c.observacoes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SEÇÃO 3 — PLANOS ALIMENTARES */}
            {/* ========================================================================= */}
            {mainSection === "planos" && paciente && (
              <PlanosAlimentaresSection
                paciente={paciente}
                planos={planos}
                onReloadPlanos={async () => {
                  if (!id) return;
                  const resPlanos = await sql`
                    SELECT * FROM planos_alimentares
                    WHERE paciente_id = ${id}
                    ORDER BY created_at DESC
                  `;
                  setPlanos(resPlanos as PlanoAlimentarItem[]);
                }}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: NOVA CONSULTA */}
        {/* ========================================================================= */}
        {modalConsultaOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Nova Consulta
                    </h3>
                    <p className="text-xs text-slate-400">
                      Paciente: <strong className="text-slate-700">{paciente?.nome}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalConsultaOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {consultaError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{consultaError}</span>
                </div>
              )}

              <form onSubmit={handleSalvarConsulta} className="space-y-4">
                {/* Data da consulta (preenchida automaticamente com hoje, editável) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Data da Consulta <span className="text-emerald-600 font-bold">*</span>
                  </label>
                  <Input
                    type="date"
                    value={novaDataConsulta}
                    onChange={(e) => setNovaDataConsulta(e.target.value)}
                    required
                  />
                </div>

                {/* Peso atual em kg (número) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Peso Atual (kg) <span className="text-emerald-600 font-bold">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 72.5"
                    value={novoPeso}
                    onChange={(e) => setNovoPeso(e.target.value)}
                    required
                  />
                </div>

                {/* Cintura e Quadril em cm (opcionais) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Cintura (cm) <span className="text-[10px] text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 80"
                      value={novaCintura}
                      onChange={(e) => setNovaCintura(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Quadril (cm) <span className="text-[10px] text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 98"
                      value={novoQuadril}
                      onChange={(e) => setNovoQuadril(e.target.value)}
                    />
                  </div>
                </div>

                {/* % de gordura (opcional) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    % de Gordura <span className="text-[10px] text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 22.5"
                    value={novoPercentualGordura}
                    onChange={(e) => setNovoPercentualGordura(e.target.value)}
                  />
                </div>

                {/* Observações (texto livre) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Observações
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Evolução, feedbacks da dieta, sintomas..."
                    value={novasObservacoes}
                    onChange={(e) => setNovasObservacoes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>

                {/* Próximo retorno (seletor de data) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Próximo Retorno
                  </label>
                  <Input
                    type="date"
                    value={novoProximoRetorno}
                    onChange={(e) => setNovoProximoRetorno(e.target.value)}
                  />
                </div>

                {/* Botões do Modal */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalConsultaOpen(false)}
                    className="text-xs cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingConsulta}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm shadow-emerald-600/20 px-5 text-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingConsulta ? "Salvando..." : "Salvar consulta"}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: VISUALIZAR CONTEÚDO DO PLANO ALIMENTAR */}
        {/* ========================================================================= */}
        {planoSelecionado && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[85vh] overflow-y-auto animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Plano Alimentar do Paciente
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data de criação: {formatDate(planoSelecionado.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlanoSelecionado(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-mono text-xs text-slate-800 whitespace-pre-wrap overflow-x-auto max-h-96">
                {typeof planoSelecionado.conteudo === "object"
                  ? JSON.stringify(planoSelecionado.conteudo, null, 2)
                  : String(planoSelecionado.conteudo)}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setPlanoSelecionado(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-5 cursor-pointer"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};