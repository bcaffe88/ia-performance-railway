import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function Organizations() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    supabaseUrl: "",
    supabaseKey: "",
    apiKey: "",
  });

  const { data: organizations, refetch } = trpc.organizations.list.useQuery();
  const createMutation = trpc.organizations.create.useMutation({
    onSuccess: () => {
      toast.success("Organização criada com sucesso!");
      refetch();
      setOpen(false);
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.organizations.update.useMutation({
    onSuccess: () => {
      toast.success("Organização atualizada!");
      refetch();
      setOpen(false);
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.organizations.delete.useMutation({
    onSuccess: () => {
      toast.success("Organização removida!");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({ name: "", supabaseUrl: "", supabaseKey: "", apiKey: "" });
    setEditId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (org: any) => {
    setEditId(org.id);
    setFormData({
      name: org.name,
      supabaseUrl: org.supabaseUrl,
      supabaseKey: org.supabaseKey,
      apiKey: org.apiKey || "",
    });
    setOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organizações</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Organização
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar" : "Nova"} Organização</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="supabaseUrl">Supabase URL</Label>
                <Input
                  id="supabaseUrl"
                  placeholder="https://xxxxx.supabase.co"
                  value={formData.supabaseUrl}
                  onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="supabaseKey">Supabase Key</Label>
                <Textarea
                  id="supabaseKey"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={formData.supabaseKey}
                  onChange={(e) => setFormData({ ...formData, supabaseKey: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="apiKey">API Key (Opcional)</Label>
                <Textarea
                  id="apiKey"
                  placeholder="Chave de API personalizada"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editId ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations?.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{org.name}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(org)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Remover esta organização?")) {
                        deleteMutation.mutate({ id: org.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Supabase URL:</span>
                  <p className="text-muted-foreground truncate">{org.supabaseUrl}</p>
                </div>
                {org.apiKey && (
                  <div>
                    <span className="font-semibold">API Key:</span>
                    <p className="text-muted-foreground">Configurada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
