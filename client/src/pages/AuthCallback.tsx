import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc"; // ← MUDANÇA AQUI: use @ ao invés de ../../
import { toast } from "sonner";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const authMutation = trpc.system.auth.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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
            setLocation("/404");
          },
        }
      );
    } else {
      toast.error("Código de autenticação não encontrado.");
      setLocation("/404");
    }
  }, [setLocation, authMutation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Processando autenticação...</p>
    </div>
  );
}
