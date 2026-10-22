import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import {
  Users,
  UserPlus,
  Search,
  Calendar,
  ChevronRight,
  RefreshCw,
  Target,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { sql } from "../lib/db";
import { formatDate } from "../lib/utils";

interface PacienteListItem {
  id: string;
  nome: string;
  objetivos: string[] | null;
  objetivo_texto: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  created_at: string;
  ultima_consulta: string | null;
}

export const PacientesPage: React.FC = () => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<PacienteListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPacientes = async (isRefresh = false) => {
    if (!user?.id) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Busca todos os pacientes da nutricionista logada e a data da última consulta de cada um
      const res = await sql`
        SELECT 
          p.id,
          p.nome,
          p.objetivos,
          p.objetivo_texto,
          p.telefone,
          p.whatsapp,
          p.email,
          p.created_at,
          (
            SELECT c.data_consulta 
            FROM consultas c 
            WHERE c.paciente_id = p.id 
            ORDER BY c.data_consulta DESC 
            LIMIT 1
          ) as ultima_consulta
        FROM pacientes p
        WHERE p.nutricionista_id = ${user.id}
        ORDER BY p.nome ASC
      `;

      setPacientes(res as PacienteListItem[]);
    } catch (err: any) {
      console.error("Erro ao carregar pacientes:", err);
      setError("Não foi possível carregar a lista de pacientes. Verifique sua conexão.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, [user]);

  // Filtro de busca por nome (case insensitive)
  const filteredPacientes = useMemo(() => {
    if (!searchTerm.trim()) return pacientes;
    const term = searchTerm.toLowerCase().trim();
    return pacientes.filter((p) => p.nome.toLowerCase().includes(term));
  }, [pacientes, searchTerm]);

  // Resumo de objetivos
  const getObjetivoText = (p: PacienteListItem) => {
    if (p.objetivos && p.objetivos.length > 0) {
      const main = p.objetivos.join(", ");
      if (p.objetivo_texto) return `${main} (${p.objetivo_texto})`;
      return main;
    }
    if (p.objetivo_texto) return p.objetivo_texto;
    return "Não informado";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Pacientes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie seus pacientes cadastrados, histórico clínico e consultas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPacientes(true)}
              disabled={loading || refreshing}
              className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 bg-white shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
              <span className="text-xs font-semibold">
                {refreshing ? "Atualizando..." : "Atualizar"}
              </span>
            </Button>

            <Link to="/pacientes/novo">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer">
                <UserPlus className="w-4 h-4" />
                <span>Novo Paciente</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPacientes(true)}
              className="border-red-200 text-red-700 hover:bg-red-100/50"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Campo de Busca no Topo da Listagem */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              type="text"
              placeholder="Buscar paciente por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="text-xs font-medium text-slate-500 self-end sm:self-center px-1">
            Total: <span className="font-bold text-slate-800">{filteredPacientes.length}</span> {filteredPacientes.length === 1 ? "paciente" : "pacientes"}
          </div>
        </div>

        {/* Listagem de Pacientes */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-18 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : pacientes.length === 0 ? (
            /* Se não houver pacientes cadastrados */
            <div className="py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Nenhum paciente cadastrado ainda
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1.5 mb-6">
                Comece cadastrando seu primeiro paciente para gerenciar consultas, planos alimentares e avaliações.
              </p>
              <Link to="/pacientes/novo">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer">
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar primeiro paciente</span>
                </Button>
              </Link>
            </div>
          ) : filteredPacientes.length === 0 ? (
            /* Filtro de busca sem resultados */
            <div className="py-12 px-6 text-center">
              <p className="text-slate-500 text-sm">
                Nenhum paciente encontrado para a busca "<span className="font-semibold text-slate-700">{searchTerm}</span>".
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="mt-3 text-xs"
              >
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPacientes.map((paciente) => (
                <Link
                  key={paciente.id}
                  to={`/pacientes/${paciente.id}`}
                  className="group block p-5 sm:px-7 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Identificação e Nome */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-xs uppercase group-hover:scale-105 transition-transform shrink-0">
                        {paciente.nome ? paciente.nome.slice(0, 2) : "PA"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {paciente.nome}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          {paciente.whatsapp || paciente.telefone || paciente.email ? (
                            <span className="truncate">
                              {paciente.whatsapp || paciente.telefone || paciente.email}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sem contato registrado</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Objetivo e Data da Última Consulta */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8 justify-between sm:justify-end text-xs">
                      {/* Objetivo */}
                      <div className="min-w-0 max-w-xs text-left sm:text-right">
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                          Objetivo
                        </span>
                        <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                          <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-700 truncate" title={getObjetivoText(paciente)}>
                            {getObjetivoText(paciente)}
                          </span>
                        </div>
                      </div>

                      {/* Data da Última Consulta */}
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                          Última Consulta
                        </span>
                        <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className={`font-medium ${paciente.ultima_consulta ? "text-slate-800" : "text-slate-400 italic"}`}>
                            {formatDate(paciente.ultima_consulta)}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 hidden sm:block" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
