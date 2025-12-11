import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Reminder } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";

const reminderSchema = z.object({
  type: z.enum(["exam_assignment", "work_meeting"]),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  dueAt: z.date({
    required_error: "Data e hora são obrigatórias",
  }),
  dueTime: z.string().min(1, "Hora é obrigatória"),
  remindBeforeMinutes: z.coerce.number().min(0, "Deve ser maior ou igual a 0"),
  repeat: z.enum(["none", "daily", "weekly", "monthly"]),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder?: Reminder | null;
}

export function ReminderDialog({ open, onOpenChange, reminder }: ReminderDialogProps) {
  const { toast } = useToast();
  const isEditing = !!reminder;

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      type: "exam_assignment",
      title: "",
      description: "",
      dueAt: new Date(),
      dueTime: "12:00",
      remindBeforeMinutes: 30,
      repeat: "none",
    },
  });

  useEffect(() => {
    if (reminder) {
      const dueAt = new Date(reminder.dueAt);
      form.reset({
        type: reminder.type as "exam_assignment" | "work_meeting",
        title: reminder.title,
        description: reminder.description || "",
        dueAt: dueAt,
        dueTime: format(dueAt, "HH:mm"),
        remindBeforeMinutes: reminder.remindBeforeMinutes,
        repeat: reminder.repeat as "none" | "daily" | "weekly" | "monthly",
      });
    } else {
      form.reset({
        type: "exam_assignment",
        title: "",
        description: "",
        dueAt: new Date(),
        dueTime: "12:00",
        remindBeforeMinutes: 30,
        repeat: "none",
      });
    }
  }, [reminder, form]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/reminders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Lembrete criado",
        description: "O lembrete foi criado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar lembrete",
        description: error.message || "Ocorreu um erro ao criar o lembrete.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/reminders/${reminder?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Lembrete atualizado",
        description: "O lembrete foi atualizado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar lembrete",
        description: error.message || "Ocorreu um erro ao atualizar o lembrete.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ReminderFormValues) => {
    // Combine date and time
    const [hours, minutes] = values.dueTime.split(":").map(Number);
    const dueAt = new Date(values.dueAt);
    dueAt.setHours(hours, minutes, 0, 0);

    const payload = {
      type: values.type,
      title: values.title,
      description: values.description || undefined,
      dueAt: dueAt.toISOString(),
      remindBeforeMinutes: values.remindBeforeMinutes,
      repeat: values.repeat,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Lembrete" : "Novo Lembrete"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere as informações do lembrete"
              : "Crie um novo lembrete para provas, trabalhos ou reuniões"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="exam_assignment">Prova/Trabalho</SelectItem>
                      <SelectItem value="work_meeting">Reunião de Trabalho</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Prova de Cálculo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione mais detalhes sobre o lembrete..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="remindBeforeMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lembrar antes (minutos)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Ex: 30"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Quanto tempo antes você deseja ser notificado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repeat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repetir</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Não repete</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
