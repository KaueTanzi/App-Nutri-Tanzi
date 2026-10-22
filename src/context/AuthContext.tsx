import React, { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "../lib/auth";

export interface UserSession {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (nome: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await authClient.getSession();
      if (res?.data?.user) {
        setUser({
          id: res.data.user.id,
          name: res.data.user.name || "Nutricionista",
          email: res.data.user.email,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn("Nenhuma sessão ativa encontrada:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (res?.error) {
        let msg = "Credenciais inválidas. Verifique seu email e senha.";
        if (res.error.message) {
          if (res.error.message.toLowerCase().includes("invalid email or password") ||
              res.error.message.toLowerCase().includes("user not found") ||
              res.error.message.toLowerCase().includes("invalid credentials")) {
            msg = "Email ou senha incorretos. Por favor, tente novamente.";
          } else {
            msg = res.error.message;
          }
        }
        return { success: false, error: msg };
      }

      await fetchSession();
      return { success: true };
    } catch (err: any) {
      console.error("Erro ao realizar login:", err);
      return {
        success: false,
        error: err?.message || "Não foi possível conectar ao serviço de autenticação. Tente novamente.",
      };
    }
  };

  const signUp = async (nome: string, email: string, password: string) => {
    try {
      const res = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: nome.trim(),
      });

      if (res?.error) {
        let msg = "Falha ao criar conta.";
        const rawMsg = res.error.message?.toLowerCase() || "";
        if (rawMsg.includes("already exists") || rawMsg.includes("duplicate")) {
          msg = "Este email já está cadastrado no sistema. Tente fazer login.";
        } else if (rawMsg.includes("password")) {
          msg = "A senha informada não atende aos requisitos mínimos.";
        } else if (res.error.message) {
          msg = res.error.message;
        }
        return { success: false, error: msg };
      }

      await fetchSession();
      return { success: true };
    } catch (err: any) {
      console.error("Erro ao realizar cadastro:", err);
      return {
        success: false,
        error: err?.message || "Erro inesperado ao realizar cadastro. Tente novamente.",
      };
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshSession: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
};
