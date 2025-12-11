import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Bell,
  Filter,
  Pencil,
  Trash2,
  Download,
  Calendar as CalendarIcon,
  Users,
  BookOpen,
  Clock,
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Reminder } from "@shared/schema";

type FilterType = "all" | "exam_assignment" | "work_meeting";

const typeConfig = {
  exam_assignment: {
    label: "Prova/Trabalho",
    icon: BookOpen,
    color: "text-blue-500",
    badgeVariant: "default" as const,
  },
  work_meeting: {
    label: "Reunião",
    icon: Users,
    color: "text-purple-500",
    badgeVariant: "secondary" as const,
  },
};

export default function RemindersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const { toast } = useToast();

  const {
    data: reminders,
    isLoading,
    error,
  } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Lembrete excluído",
        description: "O lembrete foi excluído com sucesso.",
      });
      setDeleteDialogOpen(false);
      setReminderToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExport = async (reminderId: number) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}/export.ics`);
      if (!response.ok) throw new Error("Erro ao exportar lembrete");
      
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
        description: "O arquivo .ics foi baixado. Você pode importá-lo no Google Calendar ou Outlook.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const filteredReminders = useMemo(() => {
    if (!reminders) return [];
    
    let filtered = reminders;
    
    if (filterType !== "all") {
      filtered = filtered.filter((r) => r.type === filterType);
    }
    
    return filtered.sort((a, b) => 
      new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    );
  }, [reminders, filterType]);

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setDialogOpen(true);
  };

  const handleDelete = (reminder: Reminder) => {
    setReminderToDelete(reminder);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingReminder(null);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              Erro ao carregar lembretes. Tente novamente mais tarde.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lembretes</h1>
            <p className="text-muted-foreground">
              Gerencie seus lembretes de provas, trabalhos e reuniões
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lembrete
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filterType}
            onValueChange={(value: FilterType) => setFilterType(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="exam_assignment">Provas/Trabalhos</SelectItem>
              <SelectItem value="work_meeting">Reuniões</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                reminders?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">lembretes ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provas/Trabalhos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                reminders?.filter((r) => r.type === "exam_assignment").length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">lembretes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reuniões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                reminders?.filter((r) => r.type === "work_meeting").length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">lembretes</p>
          </CardContent>
        </Card>
      </div>

      {/* Reminders List */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Lembretes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Nenhum lembrete encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                {filterType === "all"
                  ? "Crie seu primeiro lembrete para começar"
                  : "Tente remover os filtros"}
              </p>
              {filterType === "all" && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lembrete
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReminders.map((reminder) => {
                const config = typeConfig[reminder.type as keyof typeof typeConfig];
                const dueDate = parseISO(reminder.dueAt.toString());
                const isOverdue = isPast(dueDate);
                const isDueToday = isToday(dueDate);

                return (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-accent ${config.color}`}>
                      <config.icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{reminder.title}</h3>
                        <Badge variant={config.badgeVariant}>
                          {config.label}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive">Atrasado</Badge>
                        )}
                        {isDueToday && !isOverdue && (
                          <Badge variant="default" className="bg-orange-500">
                            Hoje
                          </Badge>
                        )}
                      </div>
                      
                      {reminder.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {reminder.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(dueDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Lembrar {reminder.remindBeforeMinutes} min antes
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExport(reminder.id)}
                        title="Exportar como .ics"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(reminder)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reminder)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
