import { useEffect } from "react";
import { useLocation, useWouter } from "wouter";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";

export default function AuthCallback() {
  const [location, setLocation] = useLocation();
  const authMutation = trpc.system.auth.mutation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (code) {
      authMutation.mutate(
        { code },
        {
          onSuccess: () => {
            toast.success("Login realizado com sucesso!");
            setLocation("/");
          },
          onError: (error) => {
            toast.error(`Erro de autenticação: ${error.message}`);
            setLocation("/404"); // Redireciona para 404 ou página de erro
          },
        }
      );
    } else {
      toast.error("Código de autenticação não encontrado.");
      setLocation("/404");
    }
  }, [location.search, setLocation, authMutation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Processando autenticação...</p>
    </div>
  );
}
