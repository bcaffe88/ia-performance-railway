import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Appointments() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    service: "",
    scheduledAt: "",
    notes: "",
    organizationId: undefined as number | undefined,
  });

  const { data: appointments, refetch } = trpc.appointments.list.useQuery();
  const { data: organizations } = trpc.organizations.list.useQuery();

  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Agendamento criado!");
      refetch();
      setOpen(false);
      setFormData({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        service: "",
        scheduledAt: "",
        notes: "",
        organizationId: undefined,
      });
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStatusMutation = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.appointments.delete.useMutation({
    onSuccess: () => {
      toast.success("Agendamento removido!");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      cancelled: "Cancelado",
      completed: "Concluído",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientPhone">Telefone</Label>
                  <Input
                    id="clientPhone"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="clientEmail">Email (Opcional)</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="service">Serviço</Label>
                <Input
                  id="service"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="scheduledAt">Data e Hora</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="organization">Organização (Opcional)</Label>
                <Select
                  value={formData.organizationId?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, organizationId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma organização" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                Criar Agendamento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {appointments?.map((appointment) => (
          <Card key={appointment.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div>
                  <span>{appointment.clientName}</span>
                  <div className="text-sm text-muted-foreground font-normal mt-1">
                    {appointment.clientPhone}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {getStatusBadge(appointment.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Remover este agendamento?")) {
                        deleteMutation.mutate({ id: appointment.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(appointment.scheduledAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(appointment.scheduledAt), "HH:mm")}</span>
                </div>
                <div>
                  <span className="font-semibold text-sm">Serviço:</span>
                  <p className="text-sm text-muted-foreground">{appointment.service}</p>
                </div>
                {appointment.notes && (
                  <div>
                    <span className="font-semibold text-sm">Observações:</span>
                    <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                  </div>
                )}
                {appointment.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "confirmed" })}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "cancelled" })}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
                {appointment.status === "confirmed" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "completed" })}
                  >
                    Marcar como Concluído
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
