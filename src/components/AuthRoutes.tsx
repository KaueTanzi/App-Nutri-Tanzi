import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";
import { Logo } from "../components/Logo";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Logo size="md" subtitle={false} />
        <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Logo size="md" subtitle={false} />
        <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
