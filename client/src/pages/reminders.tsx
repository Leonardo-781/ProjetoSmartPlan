import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Bell, Calendar, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReminderDialog } from "@/components/reminder-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Reminder } from "@shared/schema";

export default function RemindersPage() {
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders", typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      const url = `/api/reminders${params.toString() ? `?${params.toString()}` : ""}`;
      return apiRequest<Reminder[]>(url);
    },
  });

  const handleNewReminder = () => {
    setSelectedReminder(null);
    setDialogOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setDialogOpen(true);
  };

  const handleExportICS = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}/export.ics`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reminder-${reminderId}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Exportado com sucesso",
        description: "O arquivo .ics foi baixado. Você pode importá-lo em seu calendário.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: "Não foi possível exportar o lembrete.",
      });
    }
  };

  const handleDispatch = async () => {
    try {
      const result = await apiRequest<{ count: number }>("/api/reminders/dispatch", {
        method: "POST",
      });
      
      toast({
        title: "Dispatcher executado",
        description: `${result.count} lembrete(s) foram processados.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao executar dispatcher",
        description: "Não foi possível processar os lembretes.",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "exam_assignment":
        return "Prova/Trabalho";
      case "work_meeting":
        return "Reunião";
      default:
        return type;
    }
  };

  const getRepeatLabel = (repeat: string) => {
    switch (repeat) {
      case "none":
        return "Não repete";
      case "daily":
        return "Diário";
      case "weekly":
        return "Semanal";
      case "monthly":
        return "Mensal";
      default:
        return repeat;
    }
  };

  const sortedReminders = [...reminders].sort((a, b) => 
    new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lembretes</h1>
          <p className="text-muted-foreground">
            Gerencie seus lembretes de provas, trabalhos e reuniões
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDispatch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Processar Notificações
          </Button>
          <Button onClick={handleNewReminder}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lembrete
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="exam_assignment">Provas/Trabalhos</SelectItem>
            <SelectItem value="work_meeting">Reuniões</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando lembretes...</p>
        </div>
      ) : sortedReminders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum lembrete encontrado</p>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro lembrete
            </p>
            <Button onClick={handleNewReminder}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Lembrete
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedReminders.map((reminder) => {
            const dueDate = new Date(reminder.dueAt);
            const isOverdue = dueDate < new Date();
            
            return (
              <Card
                key={reminder.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  isOverdue ? "border-destructive" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1" onClick={() => handleEditReminder(reminder)}>
                      <CardTitle className="flex items-center gap-2">
                        {reminder.title}
                        {isOverdue && (
                          <Badge variant="destructive">Atrasado</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {reminder.description || "Sem descrição"}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportICS(reminder.id);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent onClick={() => handleEditReminder(reminder)}>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(dueDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <Badge variant="outline">{getTypeLabel(reminder.type)}</Badge>
                    <Badge variant="secondary">
                      <Bell className="mr-1 h-3 w-3" />
                      {reminder.remindBeforeMinutes} min antes
                    </Badge>
                    {reminder.repeat !== "none" && (
                      <Badge variant="secondary">{getRepeatLabel(reminder.repeat)}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reminder={selectedReminder}
      />
    </div>
  );
}
