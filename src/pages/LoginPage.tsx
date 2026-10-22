import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { Logo } from "../components/Logo";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Por favor, preencha o seu endereço de email.");
      return;
    }

    if (!password) {
      setErrorMessage("Por favor, insira sua senha.");
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setErrorMessage(result.error || "Erro ao efetuar login.");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
      {/* Lado Esquerdo - Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <Logo size="md" />
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Acesse sua conta
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Bem-vindo(a) de volta! Entre com suas credenciais para gerenciar seus pacientes.
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
                  E-mail profissional
                </label>
                <Input
                  type="email"
                  placeholder="nutri@exemplo.com.br"
                  icon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha de acesso"
                    icon={<Lock className="w-4 h-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
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

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600 border-t border-slate-100 pt-5">
              <span>Não tem conta? </span>
              <Link
                to="/cadastro"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                Cadastre-se
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
            Nutri Tanzi &copy; 2026. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Lado Direito - Apresentação Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-12 flex-col justify-between overflow-hidden">
        {/* Efeitos decorativos */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 text-emerald-200">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs uppercase tracking-widest font-semibold">Plataforma Especializada</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Gestão nutricional inteligente e personalizada.
          </h2>
          <p className="text-emerald-100/90 text-base leading-relaxed">
            Tenha total controle sobre prontuários, planos alimentares, anamneses e a evolução dos seus pacientes em um único ambiente seguro.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-emerald-100 mt-1">Conformidade e Isolamento RLS</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-2xl font-bold text-white">Neon Auth</div>
              <div className="text-xs text-emerald-100 mt-1">Segurança de ponta a ponta</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs text-emerald-200/80">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Dados criptografados e protegidos por autenticação nativa Neon.</span>
        </div>
      </div>
    </div>
  );
};
