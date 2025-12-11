import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Bell,
  Pencil,
  Trash2,
  Download,
  Calendar,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReminderDialog } from "@/components/reminder-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  getReminders, 
  deleteReminder, 
  exportReminderICS,
  dispatchReminders,
} from "@/lib/api/reminders";
import type { Reminder } from "@shared/schema";

type FilterType = "all" | "exam_assignment" | "work_meeting";

const typeConfig = {
  exam_assignment: {
    label: "Prova/Trabalho",
    icon: AlertCircle,
    color: "bg-orange-500",
  },
  work_meeting: {
    label: "Reunião de Trabalho",
    icon: Briefcase,
    color: "bg-blue-500",
  },
};

const repeatLabels = {
  none: "Não repete",
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

export default function RemindersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const { toast } = useToast();

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
    queryFn: () => getReminders(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Lembrete excluído",
        description: "O lembrete foi removido com sucesso.",
      });
      setDeleteDialogOpen(false);
      setReminderToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o lembrete.",
        variant: "destructive",
      });
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: dispatchReminders,
    onSuccess: (result) => {
      toast({
        title: "Dispatcher executado",
        description: `Processados: ${result.processed}, Notificados: ${result.notified}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no dispatcher",
        description: error.message || "Não foi possível executar o dispatcher.",
        variant: "destructive",
      });
    },
  });

  const filteredReminders = useMemo(() => {
    return reminders.filter((reminder) => {
      if (filterType !== "all" && reminder.type !== filterType) return false;
      return true;
    });
  }, [reminders, filterType]);

  const sortedReminders = useMemo(() => {
    return [...filteredReminders].sort((a, b) => {
      const dateA = new Date(a.dueAt).getTime();
      const dateB = new Date(b.dueAt).getTime();
      return dateA - dateB;
    });
  }, [filteredReminders]);

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setDialogOpen(true);
  };

  const handleDelete = (reminder: Reminder) => {
    setReminderToDelete(reminder);
    setDeleteDialogOpen(true);
  };

  const handleExport = async (reminder: Reminder) => {
    try {
      const blob = await exportReminderICS(reminder.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reminder-${reminder.id}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exportado com sucesso",
        description: "O arquivo .ics foi baixado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: error instanceof Error ? error.message : "Não foi possível exportar o lembrete.",
        variant: "destructive",
      });
    }
  };

  const handleNewReminder = () => {
    setEditingReminder(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingReminder(null);
  };

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: reminders.length,
      exams: reminders.filter((r) => r.type === "exam_assignment").length,
      meetings: reminders.filter((r) => r.type === "work_meeting").length,
      upcoming: reminders.filter((r) => new Date(r.dueAt) > now).length,
    };
  }, [reminders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Lembretes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus lembretes de provas, trabalhos e reuniões
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => dispatchMutation.mutate()}
            disabled={dispatchMutation.isPending}
          >
            {dispatchMutation.isPending ? "Executando..." : "Executar Dispatcher"}
          </Button>
          <Button onClick={handleNewReminder}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lembrete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provas/Trabalhos</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.exams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reuniões</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.meetings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Meus Lembretes</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={filterType}
                onValueChange={(value) => setFilterType(value as FilterType)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="exam_assignment">Provas/Trabalhos</SelectItem>
                  <SelectItem value="work_meeting">Reuniões</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedReminders.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum lembrete encontrado. Crie seu primeiro lembrete!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReminders.map((reminder) => {
                const config = typeConfig[reminder.type as keyof typeof typeConfig];
                const Icon = config?.icon || Bell;
                const dueDate = new Date(reminder.dueAt);
                
                return (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className={`h-12 w-12 rounded-lg ${config?.color} flex items-center justify-center text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{reminder.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {config?.label}
                        </Badge>
                        {reminder.repeat !== "none" && (
                          <Badge variant="secondary" className="text-xs">
                            {repeatLabels[reminder.repeat as keyof typeof repeatLabels]}
                          </Badge>
                        )}
                      </div>
                      {reminder.description && (
                        <p className="text-sm text-muted-foreground mb-1 truncate">
                          {reminder.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(dueDate, "PPp", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          {reminder.remindBeforeMinutes} min antes
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExport(reminder)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(reminder)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reminder)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ReminderDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        reminder={editingReminder}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lembrete</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lembrete "{reminderToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reminderToDelete) {
                  deleteMutation.mutate(reminderToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
