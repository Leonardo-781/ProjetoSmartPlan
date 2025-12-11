import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Bell,
  Filter,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  BookOpen,
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Reminder } from "@shared/schema";

type FilterType = "all" | "exam_assignment" | "work_meeting";

const typeConfig = {
  exam_assignment: {
    label: "Prova/Trabalho",
    icon: BookOpen,
    color: "bg-blue-500",
  },
  work_meeting: {
    label: "Reunião",
    icon: Briefcase,
    color: "bg-purple-500",
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { toast } = useToast();

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Lembrete excluído",
        description: "O lembrete foi removido com sucesso.",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/reminders/${id}/export.ics`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reminder-${id}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Exportado com sucesso",
        description: "O arquivo .ics foi baixado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar o lembrete.",
        variant: "destructive",
      });
    },
  });

  const filteredReminders = useMemo(() => {
    let result = reminders;
    if (filterType !== "all") {
      result = result.filter((r) => r.type === filterType);
    }
    return result.sort((a, b) => {
      const dateA = new Date(a.dueAt).getTime();
      const dateB = new Date(b.dueAt).getTime();
      return dateA - dateB;
    });
  }, [reminders, filterType]);

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setDialogOpen(true);
  };

  const handleDelete = (reminder: Reminder) => {
    setReminderToDelete(reminder);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (reminderToDelete) {
      deleteMutation.mutate(reminderToDelete.id);
    }
    setDeleteDialogOpen(false);
    setReminderToDelete(null);
  };

  const handleExport = (id: string) => {
    exportMutation.mutate(id);
  };

  // Calendar view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const remindersInMonth = filteredReminders.filter((reminder) => {
    const reminderDate = new Date(reminder.dueAt);
    return isSameMonth(reminderDate, currentMonth);
  });

  const getRemindersForDay = (day: Date) => {
    return remindersInMonth.filter((reminder) =>
      isSameDay(new Date(reminder.dueAt), day)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lembretes</h1>
          <p className="text-muted-foreground">
            Gerencie seus lembretes de provas, trabalhos e reuniões
          </p>
        </div>
        <Button onClick={() => {
          setEditingReminder(null);
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lembrete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as FilterType)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="exam_assignment">Prova/Trabalho</SelectItem>
                <SelectItem value="work_meeting">Reunião</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground p-2"
              >
                {day}
              </div>
            ))}
            {daysInMonth.map((day) => {
              const dayReminders = getRemindersForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] p-2 border rounded-md ${
                    isToday ? "bg-primary/5 border-primary" : "bg-background"
                  }`}
                >
                  <div className={`text-sm ${isToday ? "font-bold" : ""}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1 mt-1">
                    {dayReminders.slice(0, 2).map((reminder) => {
                      const config = typeConfig[reminder.type as keyof typeof typeConfig] || typeConfig.exam_assignment;
                      return (
                        <div
                          key={reminder.id}
                          className={`text-xs p-1 rounded ${config.color} text-white truncate cursor-pointer hover:opacity-80`}
                          onClick={() => handleEdit(reminder)}
                          title={reminder.title}
                        >
                          {reminder.title}
                        </div>
                      );
                    })}
                    {dayReminders.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayReminders.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Lembretes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum lembrete encontrado
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReminders.map((reminder) => {
                const config = typeConfig[reminder.type as keyof typeof typeConfig] || typeConfig.exam_assignment;
                const Icon = config.icon;
                
                return (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${config.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{reminder.title}</h3>
                        <Badge variant="outline">{config.label}</Badge>
                        {reminder.repeat !== "none" && (
                          <Badge variant="secondary">
                            {repeatLabels[reminder.repeat as keyof typeof repeatLabels]}
                          </Badge>
                        )}
                      </div>
                      {reminder.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {reminder.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          {format(new Date(reminder.dueAt), "PPP 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                        {reminder.remindBeforeMinutes > 0 && (
                          <span className="flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            {reminder.remindBeforeMinutes} min antes
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(reminder.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(reminder)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
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
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingReminder(null);
        }}
        reminder={editingReminder}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lembrete?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lembrete será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
