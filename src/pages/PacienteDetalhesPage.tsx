import React, { useEffect, useState } from "react";
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
  Activity,
  HeartPulse,
  CheckCircle2,
  Target,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { sql } from "../lib/db";
import { formatDate } from "../lib/utils";

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

export const PacienteDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation();

  const [paciente, setPaciente] = useState<PacienteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(
    (location.state as any)?.message || null
  );

  useEffect(() => {
    async function loadPaciente() {
      if (!id || !user?.id) return;
      try {
        const res = await sql`
          SELECT * FROM pacientes 
          WHERE id = ${id} AND nutricionista_id = ${user.id}
          LIMIT 1
        `;
        if (res && res.length > 0) {
          setPaciente(res[0] as PacienteData);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do paciente:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPaciente();
  }, [id, user]);

  const calculateIMC = (peso: number | string | null, alturaCm: number | string | null) => {
    if (!peso || !alturaCm) return null;
    const p = typeof peso === "number" ? peso : parseFloat(String(peso).replace(",", "."));
    const a = typeof alturaCm === "number" ? alturaCm : parseFloat(String(alturaCm).replace(",", "."));
    if (!p || !a || p <= 0 || a <= 0 || isNaN(p) || isNaN(a)) return null;
    const alturaMetros = a > 3 ? a / 100 : a;
    const imc = p / (alturaMetros * alturaMetros);
    if (isNaN(imc) || !isFinite(imc)) return null;
    return imc.toFixed(2);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
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

        {feedbackMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{feedbackMsg}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs text-emerald-700 hover:underline"
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
            {/* Header com avatar e contatos */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-2xl flex items-center justify-center uppercase shadow-md shadow-emerald-500/20">
                  {paciente.nome ? paciente.nome.slice(0, 2) : "PA"}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {paciente.nome}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                    {paciente.sexo && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                        {paciente.sexo}
                      </span>
                    )}
                    {paciente.data_nascimento && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(paciente.data_nascimento)}
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

            {/* Grid com Métricas Clínicas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Peso Inicial
                  </span>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : "Não registrado"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Ruler className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Altura
                  </span>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {paciente.altura ? `${paciente.altura} cm` : "Não registrada"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    IMC Inicial
                  </span>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {calculateIMC(paciente.peso_inicial, paciente.altura)
                      ? `${calculateIMC(paciente.peso_inicial, paciente.altura)} kg/m²`
                      : "Sem cálculo"}
                  </p>
                </div>
              </div>
            </div>

            {/* Detalhes Clínicos e Hábitos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Clínico */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Objetivos e Condições Clínicas
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                      Objetivo Principal
                    </span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {paciente.objetivos && paciente.objetivos.length > 0
                        ? paciente.objetivos.join(", ")
                        : "Não informado"}
                      {paciente.objetivo_texto && ` (${paciente.objetivo_texto})`}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                      Nível de Atividade Física
                    </span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {paciente.nivel_atividade || "Não informado"}
                    </p>
                  </div>

                  {paciente.patologias && paciente.patologias.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                        Patologias
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {paciente.patologias.map((p) => (
                          <span
                            key={p}
                            className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                        Restrições Alimentares
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {paciente.restricoes_alimentares.map((r) => (
                          <span
                            key={r}
                            className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {paciente.alergias && paciente.alergias.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                        Alergias
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {paciente.alergias.map((a) => (
                          <span
                            key={a}
                            className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {paciente.medicamentos && (
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                        Medicamentos
                      </span>
                      <p className="text-slate-700 mt-0.5 bg-slate-50 p-2 rounded-xl">
                        {paciente.medicamentos}
                      </p>
                    </div>
                  )}

                  {paciente.suplementos && (
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                        Suplementos
                      </span>
                      <p className="text-slate-700 mt-0.5 bg-slate-50 p-2 rounded-xl">
                        {paciente.suplementos}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Hábitos e Rotina */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Hábitos Diários e Estilo de Vida
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50">
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                        Refeições / Dia
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {paciente.refeicoes_por_dia || "-"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50">
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                        Água por Dia
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {paciente.litros_agua ? `${paciente.litros_agua} L` : "-"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50">
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                        Horário que Acorda
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {paciente.horario_acorda || "-"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50">
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                        Horário que Dorme
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {paciente.horario_dorme || "-"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                      Atividade Física
                    </span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {paciente.atividade_fisica === true
                        ? `Sim — ${paciente.atividade_fisica_descricao || "Sem detalhes"}`
                        : paciente.atividade_fisica === false
                        ? "Não pratica"
                        : "Não informado"}
                    </p>
                  </div>

                  {paciente.observacoes && (
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                        Observações Gerais
                      </span>
                      <p className="text-slate-700 mt-0.5 bg-slate-50 p-2.5 rounded-xl whitespace-pre-wrap leading-relaxed">
                        {paciente.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
