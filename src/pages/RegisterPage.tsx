import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, CheckCircle2, ShieldCheck, HeartPulse } from "lucide-react";
import { Logo } from "../components/Logo";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações
    if (!nome.trim()) {
      setErrorMessage("Por favor, preencha seu nome completo.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Por favor, preencha seu e-mail.");
      return;
    }

    // Regra: Senha deve ter no mínimo 9 caracteres
    if (password.length < 9) {
      setErrorMessage("A senha deve ter no mínimo 9 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);
    const result = await signUp(nome, email, password);
    setLoading(false);

    if (result.success) {
      // Redireciona diretamente para o dashboard
      navigate("/dashboard");
    } else {
      setErrorMessage(result.error || "Ocorreu um erro ao criar a conta.");
    }
  };

  const isPasswordLongEnough = password.length >= 9;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
      {/* Lado Esquerdo - Formulário de Cadastro */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-md">
          {/* Logo no topo */}
          <div className="mb-6">
            <Logo size="md" />
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Criar conta profissional
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Cadastre-se para começar a gerenciar seus atendimentos e prescrever dietas com precisão.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-200/60 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome completo
                </label>
                <Input
                  type="text"
                  placeholder="Dra. Mariana Silva"
                  icon={<User className="w-4 h-4" />}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={loading}
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  E-mail profissional
                </label>
                <Input
                  type="email"
                  placeholder="mariana.nutri@clinica.com"
                  icon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Senha
                  </label>
                  <span className={`text-[11px] font-medium transition-colors ${
                    isPasswordLongEnough ? "text-emerald-600" : "text-slate-400"
                  }`}>
                    mínimo 9 caracteres
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie sua senha segura"
                    icon={<Lock className="w-4 h-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita sua senha"
                    icon={<Lock className="w-4 h-4" />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && passwordsMatch && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> As senhas coincidem
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Criando conta...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar conta</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600 border-t border-slate-100 pt-5">
              <span>Já tem conta? </span>
              <Link
                to="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                Faça login
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Nutri Tanzi &copy; 2026. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Lado Direito - Apresentação Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 text-emerald-200">
          <HeartPulse className="w-5 h-5" />
          <span className="text-xs uppercase tracking-widest font-semibold">Tecnologia para Nutrição</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Pronto para transformar sua prática clínica?
          </h2>
          <p className="text-emerald-100/90 text-base leading-relaxed">
            Cadastre-se gratuitamente e descubra como uma rotina clínica organizada eleva a retenção e adesão dos seus pacientes.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
              <span>Criação imediata do seu perfil de nutricionista no banco de dados</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
              <span>Isolamento seguro de pacientes via PostgreSQL Row-Level Security</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
              <span>Acesso contínuo sem necessidade de reconectar a todo instante</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs text-emerald-200/80">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Segurança rigorosa com Neon Serverless Postgres e Neon Auth.</span>
        </div>
      </div>
    </div>
  );
};
