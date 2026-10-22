import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import {
  ArrowLeft,
  User,
  Activity,
  HeartPulse,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Scale,
  Ruler,
  Clock,
  Droplets,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { sql } from "../lib/db";

// Opções padrão especificadas no Prompt 4
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

export const PacienteNovoPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado da Aba Ativa: 'pessoal' | 'clinico' | 'habitos'
  const [activeTab, setActiveTab] = useState<"pessoal" | "clinico" | "habitos">("pessoal");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Aba 1: Pessoal ---
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<string>("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // --- Aba 2: Clínico ---
  const [pesoAtual, setPesoAtual] = useState("");
  const [alturaCm, setAlturaCm] = useState("");
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState("");
  const [nivelAtividade, setNivelAtividade] = useState("");

  const [patologiasSelecionadas, setPatologiasSelecionadas] = useState<string[]>([]);
  const [patologiaExtra, setPatologiaExtra] = useState("");
  const [restricoesSelecionadas, setRestricoesSelecionadas] = useState<string[]>([]);
  const [restricaoExtra, setRestricaoExtra] = useState("");
  const [alergiasSelecionadas, setAlergiasSelecionadas] = useState<string[]>([]);
  const [alergiaExtra, setAlergiaExtra] = useState("");

  const [medicamentos, setMedicamentos] = useState("");
  const [suplementos, setSuplementos] = useState("");

  // --- Aba 3: Hábitos ---
  const [refeicoesPorDia, setRefeicoesPorDia] = useState("");
  const [horarioAcordaInput, setHorarioAcordaInput] = useState("");
  const [horarioDormeInput, setHorarioDormeInput] = useState("");
  const [litrosAgua, setLitrosAgua] = useState("");
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState<boolean | null>(null);
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Cálculo da Idade
  const idadeCalculada = useMemo(() => {
    if (!dataNascimento) return null;
    const nasc = new Date(dataNascimento);
    if (isNaN(nasc.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade >= 0 ? idade : null;
  }, [dataNascimento]);

  // Cálculo do IMC (peso em kg / (altura em m)²)
  const imcCalculado = useMemo(() => {
    const p = parseFloat(pesoAtual.replace(",", "."));
    const a = parseFloat(alturaCm.replace(",", "."));
    if (!p || !a || p <= 0 || a <= 0) return null;
    // altura digitada em cm convertida para metros
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
  }, [pesoAtual, alturaCm]);

  // Conversão de números para formato de hora (ex: 6 -> 06:00, 630 -> 06:30, 23 -> 23:00)
  const formatHourString = (raw: string) => {
    if (!raw.trim()) return "";
    // Se já estiver formatado com dois pontos (ex 06:30)
    if (raw.includes(":")) {
      const parts = raw.split(":");
      const h = parts[0].padStart(2, "0");
      const m = (parts[1] || "00").padEnd(2, "0");
      return `${h}:${m}`;
    }
    const cleanDigits = raw.replace(/\D/g, "");
    if (!cleanDigits) return raw;
    if (cleanDigits.length <= 2) {
      const h = cleanDigits.padStart(2, "0");
      return `${h}:00`;
    }
    if (cleanDigits.length === 3) {
      const h = cleanDigits[0].padStart(2, "0");
      const m = cleanDigits.slice(1, 3);
      return `${h}:${m}`;
    }
    const h = cleanDigits.slice(0, 2);
    const m = cleanDigits.slice(2, 4);
    return `${h}:${m}`;
  };

  // Formatação de telefone / whatsapp
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Toggle de múltipla escolha para chips/tags
  const toggleArrayItem = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (item === "Nenhum") {
      if (list.includes("Nenhum")) {
        setList([]);
      } else {
        setList(["Nenhum"]);
      }
      return;
    }

    // Se selecionar outro item, remove "Nenhum"
    const withoutNenhum = list.filter((i) => i !== "Nenhum");
    if (withoutNenhum.includes(item)) {
      setList(withoutNenhum.filter((i) => i !== item));
    } else {
      setList([...withoutNenhum, item]);
    }
  };

  // Adicionar item customizado em Patologias, Restrições ou Alergias
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

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validação: único campo obrigatório é o nome completo
    if (!nome.trim()) {
      setActiveTab("pessoal");
      setErrorMessage("O campo Nome Completo é obrigatório.");
      return;
    }

    if (!user?.id) {
      setErrorMessage("Sessão expirada. Faça login novamente para cadastrar pacientes.");
      return;
    }

    setSaving(true);

    try {
      // Normalização dos dados numéricos
      const pesoNum = pesoAtual ? parseFloat(pesoAtual.replace(",", ".")) : null;
      const alturaNum = alturaCm ? parseFloat(alturaCm.replace(",", ".")) : null;
      const refeicoesNum = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null;
      const litrosNum = litrosAgua ? parseFloat(litrosAgua.replace(",", ".")) : null;

      // Formatação de horários
      const horarioAcordaFmt = horarioAcordaInput ? formatHourString(horarioAcordaInput) : null;
      const horarioDormeFmt = horarioDormeInput ? formatHourString(horarioDormeInput) : null;

      // Inserção no banco Neon com nutricionista_id vinculado
      const result = await sql`
        INSERT INTO pacientes (
          nutricionista_id,
          nome,
          data_nascimento,
          sexo,
          telefone,
          whatsapp,
          email,
          peso_inicial,
          altura,
          objetivos,
          objetivo_texto,
          nivel_atividade,
          patologias,
          restricoes_alimentares,
          alergias,
          medicamentos,
          suplementos,
          refeicoes_por_dia,
          horario_acorda,
          horario_dorme,
          litros_agua,
          atividade_fisica,
          atividade_fisica_descricao,
          observacoes
        ) VALUES (
          ${user.id},
          ${nome.trim()},
          ${dataNascimento || null},
          ${sexo || null},
          ${telefone || null},
          ${whatsapp || null},
          ${email.trim() || null},
          ${pesoNum},
          ${alturaNum},
          ${objetivosSelecionados},
          ${objetivoTexto.trim() || null},
          ${nivelAtividade || null},
          ${patologiasSelecionadas},
          ${restricoesSelecionadas},
          ${alergiasSelecionadas},
          ${medicamentos.trim() || null},
          ${suplementos.trim() || null},
          ${refeicoesNum},
          ${horarioAcordaFmt},
          ${horarioDormeFmt},
          ${litrosNum},
          ${praticaAtividadeFisica},
          ${praticaAtividadeFisica ? (atividadeFisicaDescricao.trim() || null) : null},
          ${observacoes.trim() || null}
        )
        RETURNING id, nome
      `;

      if (result && result.length > 0) {
        const newPatientId = result[0].id;
        setSuccessMessage(`Paciente ${result[0].nome} cadastrado com sucesso!`);
        // Redireciona para o perfil do paciente recém-cadastrado
        setTimeout(() => {
          navigate(`/pacientes/${newPatientId}`, {
            state: { message: "Paciente cadastrado com sucesso!" },
          });
        }, 1200);
      }
    } catch (err: any) {
      console.error("Erro ao salvar paciente no Neon:", err);
      setErrorMessage(
        err?.message || "Erro ao salvar os dados do paciente. Verifique os campos e tente novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
        {/* Top Header / Voltar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/pacientes">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 bg-white shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Lista</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Novo Paciente
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Preencha os dados do paciente para iniciar o acompanhamento.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm shadow-emerald-600/20 px-5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Salvando..." : "Salvar Paciente"}</span>
            </Button>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Abas do Formulário */}
        <div className="flex border-b border-slate-200/80 gap-2 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("pessoal")}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "pessoal"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Pessoal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("clinico")}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "clinico"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>2. Clínico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("habitos")}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "habitos"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>3. Hábitos</span>
          </button>
        </div>

        {/* ===================== ABA 1: PESSOAL ===================== */}
        {activeTab === "pessoal" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-800">
                Informações Pessoais e de Contato
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dados básicos para identificação do paciente. Apenas o nome completo é obrigatório.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nome Completo (obrigatório) */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Nome Completo <span className="text-emerald-600 font-bold">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Maria da Silva Souza"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              {/* Data de Nascimento com cálculo de idade */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Data de Nascimento
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>
                {idadeCalculada !== null && (
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-1">
                    Idade: {idadeCalculada} {idadeCalculada === 1 ? "ano" : "anos"}
                  </p>
                )}
              </div>

              {/* Sexo (seleção única) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Sexo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Feminino", "Masculino", "Outro"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSexo(s)}
                      className={`h-11 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        sexo === s
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telefone formatado */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Telefone
                </label>
                <Input
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  icon={<Phone className="w-4 h-4" />}
                />
              </div>

              {/* WhatsApp formatado */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  WhatsApp
                </label>
                <Input
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  icon={<Phone className="w-4 h-4 text-emerald-600" />}
                />
              </div>

              {/* Email */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="paciente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => setActiveTab("clinico")}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-5 cursor-pointer"
              >
                Próximo: Dados Clínicos →
              </Button>
            </div>
          </div>
        )}

        {/* ===================== ABA 2: CLÍNICO ===================== */}
        {activeTab === "clinico" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-800">
                Avaliação Clínica e Objetivos
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Métricas antropométricas iniciais, diagnósticos e restrições alimentares.
              </p>
            </div>

            {/* Antropometria: Peso, Altura e IMC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Peso atual */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Peso Atual
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={pesoAtual}
                    onChange={(e) => setPesoAtual(e.target.value)}
                    icon={<Scale className="w-4 h-4" />}
                    className="pr-12"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* Altura em cm */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Altura
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="175"
                    value={alturaCm}
                    onChange={(e) => setAlturaCm(e.target.value)}
                    icon={<Ruler className="w-4 h-4" />}
                    className="pr-12"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    cm
                  </span>
                </div>
              </div>

              {/* IMC Calculado (somente leitura) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  IMC (Automático)
                </label>
                <div className="h-11 rounded-xl bg-slate-50 border border-slate-200 px-3.5 flex items-center justify-between">
                  {imcCalculado ? (
                    <>
                      <span className="font-bold text-slate-900 text-sm">
                        {imcCalculado.valor} <span className="text-xs text-slate-400 font-normal">kg/m²</span>
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
                  const isSelected = objetivosSelecionados.includes(obj);
                  return (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => toggleArrayItem(obj, objetivosSelecionados, setObjetivosSelecionados)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {obj}
                    </button>
                  );
                })}
              </div>

              {/* Campo de texto livre adicional para objetivos */}
              <div className="pt-1">
                <Input
                  type="text"
                  placeholder="Informações adicionais sobre os objetivos do paciente..."
                  value={objetivoTexto}
                  onChange={(e) => setObjetivoTexto(e.target.value)}
                />
              </div>
            </div>

            {/* Nível de atividade física (seleção única) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Nível de Atividade Física
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {NIVEIS_ATIVIDADE.map((nivel) => (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => setNivelAtividade(nivel)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                      nivelAtividade === nivel
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {nivel}
                  </button>
                ))}
              </div>
            </div>

            {/* Patologias ou Condições de Saúde */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Patologias ou Condições de Saúde
                </label>
                <span className="text-[11px] text-slate-400">Múltipla escolha ou digite abaixo</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleArrayItem("Nenhum", patologiasSelecionadas, setPatologiasSelecionadas)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    patologiasSelecionadas.includes("Nenhum")
                      ? "bg-slate-800 border-slate-800 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Nenhum
                </button>
                {PATOLOGIAS_OPTIONS.map((pat) => {
                  const isSelected = patologiasSelecionadas.includes(pat);
                  return (
                    <button
                      key={pat}
                      type="button"
                      onClick={() => toggleArrayItem(pat, patologiasSelecionadas, setPatologiasSelecionadas)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {pat}
                    </button>
                  );
                })}
              </div>

              {/* Tags adicionadas livres */}
              {patologiasSelecionadas.filter((p) => !PATOLOGIAS_OPTIONS.includes(p) && p !== "Nenhum").length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {patologiasSelecionadas
                    .filter((p) => !PATOLOGIAS_OPTIONS.includes(p) && p !== "Nenhum")
                    .map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-medium"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => setPatologiasSelecionadas(patologiasSelecionadas.filter((i) => i !== item))}
                          className="hover:text-emerald-950"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                </div>
              )}

              {/* Campo para adicionar livremente */}
              <div className="flex gap-2 pt-1">
                <Input
                  type="text"
                  placeholder="Outra patologia ou condição..."
                  value={patologiaExtra}
                  onChange={(e) => setPatologiaExtra(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustom(patologiaExtra, setPatologiaExtra, patologiasSelecionadas, setPatologiasSelecionadas);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAddCustom(patologiaExtra, setPatologiaExtra, patologiasSelecionadas, setPatologiasSelecionadas)
                  }
                  className="px-3"
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            {/* Restrições Alimentares */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Restrições Alimentares
                </label>
                <span className="text-[11px] text-slate-400">Múltipla escolha ou digite abaixo</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleArrayItem("Nenhum", restricoesSelecionadas, setRestricoesSelecionadas)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    restricoesSelecionadas.includes("Nenhum")
                      ? "bg-slate-800 border-slate-800 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Nenhum
                </button>
                {RESTRICOES_OPTIONS.map((rest) => {
                  const isSelected = restricoesSelecionadas.includes(rest);
                  return (
                    <button
                      key={rest}
                      type="button"
                      onClick={() => toggleArrayItem(rest, restricoesSelecionadas, setRestricoesSelecionadas)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {rest}
                    </button>
                  );
                })}
              </div>

              {/* Tags adicionadas livres */}
              {restricoesSelecionadas.filter((r) => !RESTRICOES_OPTIONS.includes(r) && r !== "Nenhum").length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {restricoesSelecionadas
                    .filter((r) => !RESTRICOES_OPTIONS.includes(r) && r !== "Nenhum")
                    .map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 text-xs font-medium"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => setRestricoesSelecionadas(restricoesSelecionadas.filter((i) => i !== item))}
                          className="hover:text-teal-950"
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
                  placeholder="Outra restrição alimentar..."
                  value={restricaoExtra}
                  onChange={(e) => setRestricaoExtra(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustom(restricaoExtra, setRestricaoExtra, restricoesSelecionadas, setRestricoesSelecionadas);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAddCustom(restricaoExtra, setRestricaoExtra, restricoesSelecionadas, setRestricoesSelecionadas)
                  }
                  className="px-3"
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            {/* Alergias Alimentares */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Alergias Alimentares
                </label>
                <span className="text-[11px] text-slate-400">Múltipla escolha ou digite abaixo</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleArrayItem("Nenhum", alergiasSelecionadas, setAlergiasSelecionadas)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    alergiasSelecionadas.includes("Nenhum")
                      ? "bg-slate-800 border-slate-800 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Nenhum
                </button>
                {ALERGIAS_OPTIONS.map((alg) => {
                  const isSelected = alergiasSelecionadas.includes(alg);
                  return (
                    <button
                      key={alg}
                      type="button"
                      onClick={() => toggleArrayItem(alg, alergiasSelecionadas, setAlergiasSelecionadas)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {alg}
                    </button>
                  );
                })}
              </div>

              {/* Tags adicionadas livres */}
              {alergiasSelecionadas.filter((a) => !ALERGIAS_OPTIONS.includes(a) && a !== "Nenhum").length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {alergiasSelecionadas
                    .filter((a) => !ALERGIAS_OPTIONS.includes(a) && a !== "Nenhum")
                    .map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-medium"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => setAlergiasSelecionadas(alergiasSelecionadas.filter((i) => i !== item))}
                          className="hover:text-amber-950"
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
                  placeholder="Outra alergia alimentar..."
                  value={alergiaExtra}
                  onChange={(e) => setAlergiaExtra(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustom(alergiaExtra, setAlergiaExtra, alergiasSelecionadas, setAlergiasSelecionadas);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAddCustom(alergiaExtra, setAlergiaExtra, alergiasSelecionadas, setAlergiasSelecionadas)
                  }
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
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  placeholder="Ex: Losartana 50mg pela manhã, Metformina 850mg..."
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Suplementos em Uso (Texto Livre)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  placeholder="Ex: Creatina 5g diárias, Whey protein pós-treino, Ômega 3..."
                  value={suplementos}
                  onChange={(e) => setSuplementos(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("pessoal")}
                className="text-xs"
              >
                ← Voltar para Pessoal
              </Button>
              <Button
                type="button"
                onClick={() => setActiveTab("habitos")}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-5 cursor-pointer"
              >
                Próximo: Hábitos diários →
              </Button>
            </div>
          </div>
        )}

        {/* ===================== ABA 3: HÁBITOS ===================== */}
        {activeTab === "habitos" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-800">
                Rotina e Hábitos de Vida
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Horários de sono, ingestão hídrica e nível de atividade para planejamento alimentar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Quantas refeições faz por dia */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Quantas Refeições Faz por Dia
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Ex: 4"
                  value={refeicoesPorDia}
                  onChange={(e) => setRefeicoesPorDia(e.target.value)}
                />
              </div>

              {/* Quantidade de água por dia */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Quantidade de Água por Dia
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                    icon={<Droplets className="w-4 h-4 text-sky-500" />}
                    className="pr-16"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    litros
                  </span>
                </div>
              </div>

              {/* Horário que acorda */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Horário que Acorda
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Ex: 6 (06:00) ou 630 (06:30)"
                    value={horarioAcordaInput}
                    onChange={(e) => setHorarioAcordaInput(e.target.value)}
                    icon={<Clock className="w-4 h-4 text-amber-500" />}
                  />
                </div>
                {horarioAcordaInput && (
                  <p className="text-xs text-slate-500">
                    Formato: <strong className="text-slate-800">{formatHourString(horarioAcordaInput)}</strong>
                  </p>
                )}
              </div>

              {/* Horário que dorme */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Horário que Dorme
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Ex: 23 (23:00) ou 2230 (22:30)"
                    value={horarioDormeInput}
                    onChange={(e) => setHorarioDormeInput(e.target.value)}
                    icon={<Clock className="w-4 h-4 text-indigo-500" />}
                  />
                </div>
                {horarioDormeInput && (
                  <p className="text-xs text-slate-500">
                    Formato: <strong className="text-slate-800">{formatHourString(horarioDormeInput)}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Pratica atividade física (sim/não) */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Pratica Atividade Física?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPraticaAtividadeFisica(true)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    praticaAtividadeFisica === true
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPraticaAtividadeFisica(false);
                    setAtividadeFisicaDescricao("");
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    praticaAtividadeFisica === false
                      ? "bg-slate-100 border-slate-400 text-slate-800"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Não
                </button>
              </div>

              {/* Se sim, abre campo de texto: qual atividade e frequência semanal */}
              {praticaAtividadeFisica === true && (
                <div className="pt-2 space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Qual atividade e frequência semanal?
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Musculação 4x na semana + Corrida aos sábados"
                    value={atividadeFisicaDescricao}
                    onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Observações gerais */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Observações Gerais (Texto Livre)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                placeholder="Anotações adicionais da anamnese, preferências, contexto do paciente..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("clinico")}
                className="text-xs"
              >
                ← Voltar para Clínico
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm shadow-emerald-600/20 px-6 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Salvando..." : "Salvar Paciente"}</span>
              </Button>
            </div>
          </div>
        )}
      </form>
    </AppLayout>
  );
};
