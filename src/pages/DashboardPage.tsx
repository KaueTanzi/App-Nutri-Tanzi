import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Sparkles,
  CalendarDays,
  UserCheck,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { sql } from "../lib/db";
import { formatDate } from "../lib/utils";

interface PacienteSemRetorno {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  ultima_consulta: string;
  proximo_retorno: string | null;
  dias_desde_consulta: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [totalPacientes, setTotalPacientes] = useState<number>(0);
  const [consultasSemana, setConsultasSemana] = useState<number>(0);
  const [pacientesSemRetorno, setPacientesSemRetorno] = useState<PacienteSemRetorno[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Total de pacientes ativos cadastrados pela nutricionista logada
      const totalPacientesRes = await sql`
        SELECT count(*)::int as total 
        FROM pacientes 
        WHERE nutricionista_id = ${user.id}
      `;
      const total = totalPacientesRes[0]?.total ?? 0;
      setTotalPacientes(Number(total));

      // 2. Consultas da semana atual
      // Considera a semana atual da segunda-feira até o domingo
      const consultasSemanaRes = await sql`
        SELECT count(*)::int as total 
        FROM consultas c
        INNER JOIN pacientes p ON c.paciente_id = p.id
        WHERE p.nutricionista_id = ${user.id}
          AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
          AND c.data_consulta < (date_trunc('week', CURRENT_DATE) + interval '7 days')::date
      `;
      const consultas = consultasSemanaRes[0]?.total ?? 0;
      setConsultasSemana(Number(consultas));

      // 3. Pacientes sem retorno
      // - cuja última consulta foi há mais de 30 dias (data_consulta < CURRENT_DATE - INTERVAL '30 days')
      // - e que não possuem próximo retorno agendado (proximo_retorno IS NULL OU proximo_retorno < CURRENT_DATE)
      const semRetornoRes = await sql`
        SELECT 
          p.id,
          p.nome,
          p.telefone,
          p.whatsapp,
          p.email,
          ult.data_consulta as ultima_consulta,
          ult.proximo_retorno,
          (CURRENT_DATE - ult.data_consulta)::int as dias_desde_consulta
        FROM pacientes p
        INNER JOIN (
          SELECT DISTINCT ON (paciente_id)
            paciente_id,
            data_consulta,
            proximo_retorno
          FROM consultas
          ORDER BY paciente_id, data_consulta DESC
        ) ult ON ult.paciente_id = p.id
        WHERE p.nutricionista_id = ${user.id}
          AND ult.data_consulta < CURRENT_DATE - INTERVAL '30 days'
          AND (ult.proximo_retorno IS NULL OR ult.proximo_retorno < CURRENT_DATE)
        ORDER BY ult.data_consulta ASC
      `;

      setPacientesSemRetorno(semRetornoRes as PacienteSemRetorno[]);
    } catch (err: any) {
      console.error("Erro ao carregar dados do dashboard Neon:", err);
      setError("Não foi possível carregar os dados em tempo real do Neon. Verifique a conexão.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Header / Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Olá, {user?.name || "Nutricionista"}
              </h1>
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Acompanhe aqui o resumo clínico e o fluxo de atendimentos dos seus pacientes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboardData(true)}
              disabled={loading || refreshing}
              className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 bg-white shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
              <span className="text-xs font-semibold">
                {refreshing ? "Atualizando..." : "Atualizar dados"}
              </span>
            </Button>

            <Link to="/pacientes">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 cursor-pointer">
                Ver todos os pacientes
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboardData(true)}
              className="border-red-200 text-red-700 hover:bg-red-100/50"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* 3 Main Informational Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 — Total de pacientes ativos */}
          <div className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all duration-200 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50/60 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-emerald-100/60 transition-colors pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  Total de Pacientes Ativos
                </span>
                <p className="text-xs text-slate-500">
                  Cadastrados sob seu acompanhamento
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shadow-xs group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-baseline justify-between relative z-10">
              {loading ? (
                <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    {totalPacientes}
                  </span>
                  <span className="text-xs font-medium text-slate-400">pacientes</span>
                </div>
              )}

              <Link
                to="/pacientes"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 group/link"
              >
                <span>Ver lista</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2 — Consultas da semana */}
          <div className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-200 transition-all duration-200 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-teal-50/60 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-teal-100/60 transition-colors pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  Consultas da Semana
                </span>
                <p className="text-xs text-slate-500">
                  Registradas na semana atual
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/80 shadow-xs group-hover:scale-105 transition-transform">
                <CalendarDays className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-baseline justify-between relative z-10">
              {loading ? (
                <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    {consultasSemana}
                  </span>
                  <span className="text-xs font-medium text-slate-400">consultas</span>
                </div>
              )}

              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <Clock className="w-3 h-3 text-slate-400" />
                Seg a Dom
              </span>
            </div>
          </div>

          {/* Quick Tip / Status indicator */}
          <div className="group relative bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-sm flex flex-col justify-between overflow-hidden md:col-span-2 lg:col-span-1">
            <div className="absolute right-0 bottom-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-medium text-emerald-100 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Dados em Tempo Real</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Banco Neon Conectado
              </h3>
              <p className="text-emerald-100 text-xs leading-relaxed">
                Consultas e pacientes isolados e protegidos por nutricionista com Row Level Security (RLS).
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100 relative z-10">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                Sincronizado
              </span>
              <span className="font-mono text-[11px] text-emerald-200 opacity-80">
                postgres@sa-east-1
              </span>
            </div>
          </div>
        </div>

        {/* Card 3 — Pacientes sem retorno */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:px-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Card 3 — Pacientes sem Retorno
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Pacientes cuja última consulta foi realizada há mais de 30 dias e não possuem retorno agendado.
              </p>
            </div>

            {pacientesSemRetorno.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                {pacientesSemRetorno.length} paciente{pacientesSemRetorno.length > 1 ? "s" : ""} requer atenção
              </span>
            )}
          </div>

          {/* Content / List */}
          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-2xl bg-slate-100/70 animate-pulse"
                  />
                ))}
              </div>
            ) : pacientesSemRetorno.length === 0 ? (
              /* Mensagem obrigatória caso não haja pacientes sem retorno */
              <div className="py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                  <UserCheck className="w-7 h-7" />
                </div>
                <h4 className="text-base font-semibold text-slate-800">
                  Nenhum paciente sem retorno no momento
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Todos os seus pacientes estão com retornos agendados ou foram consultados nos últimos 30 dias.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pacientesSemRetorno.map((paciente) => (
                  <Link
                    key={paciente.id}
                    to={`/pacientes/${paciente.id}`}
                    className="group block py-4 first:pt-0 last:pb-0 transition-colors hover:bg-slate-50/80 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-2xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-sm border border-amber-200/60 uppercase group-hover:bg-amber-100 transition-colors shrink-0">
                          {paciente.nome ? paciente.nome.slice(0, 2) : "PA"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                              {paciente.nome}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                          </div>
                          {(paciente.telefone || paciente.whatsapp || paciente.email) && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {paciente.whatsapp || paciente.telefone || paciente.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                        <div className="text-left sm:text-right">
                          <span className="text-slate-400 block text-[11px]">
                            Última consulta
                          </span>
                          <span className="font-medium text-slate-700">
                            {formatDate(paciente.ultima_consulta)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 text-[11px]">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {paciente.dias_desde_consulta} dias atrás
                          </span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 hidden sm:block" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
