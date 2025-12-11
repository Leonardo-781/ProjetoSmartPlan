import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Filter, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { ReminderList } from "@/components/reminders/ReminderList";
import { ReminderCalendar } from "@/components/reminders/ReminderCalendar";
import { remindersApi } from "@/api/reminders";
import type { Reminder } from "@shared/schema";
import type { CreateReminderData, ReminderFilters } from "@/api/reminders";
import { queryClient } from "@/lib/queryClient";

export default function RemindersPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filters: ReminderFilters = {};
  if (typeFilter !== "all") {
    filters.type = typeFilter as any;
  }

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders", filters],
    queryFn: () => remindersApi.getReminders(filters),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReminderData) => remindersApi.createReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setDialogOpen(false);
      toast({
        title: "Lembrete criado",
        description: "O lembrete foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateReminderData }) =>
      remindersApi.updateReminder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setDialogOpen(false);
      setEditingReminder(null);
      toast({
        title: "Lembrete atualizado",
        description: "O lembrete foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remindersApi.deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setDeleteDialogOpen(false);
      setReminderToDelete(null);
      toast({
        title: "Lembrete excluído",
        description: "O lembrete foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: CreateReminderData) => {
    if (editingReminder) {
      await updateMutation.mutateAsync({ id: editingReminder.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setReminderToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleExport = async (id: string) => {
    try {
      await remindersApi.exportReminder(id);
      toast({
        title: "Exportado com sucesso",
        description: "O arquivo .ics foi baixado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNewReminder = () => {
    setEditingReminder(null);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lembretes</h1>
          <p className="text-muted-foreground">
            Gerencie seus lembretes de provas, trabalhos e reuniões
          </p>
        </div>
        <Button onClick={handleNewReminder}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lembrete
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Filtros</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="exam_assignment">
                        Prova/Trabalho
                      </SelectItem>
                      <SelectItem value="work_meeting">
                        Trabalho/Reunião
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-12">
              <p>Carregando lembretes...</p>
            </div>
          ) : (
            <ReminderList
              reminders={reminders}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExport={handleExport}
            />
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <ReminderCalendar reminders={reminders} />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingReminder ? "Editar Lembrete" : "Novo Lembrete"}
            </DialogTitle>
          </DialogHeader>
          <ReminderForm
            initialData={editingReminder || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setDialogOpen(false);
              setEditingReminder(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lembrete? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reminderToDelete) {
                  deleteMutation.mutate(reminderToDelete);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
