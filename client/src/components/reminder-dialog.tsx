import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Reminder } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["exam_assignment", "work_meeting"], {
    required_error: "Tipo é obrigatório",
  }),
  dueAt: z.string().min(1, "Data e hora são obrigatórias"),
  remindBeforeMinutes: z.coerce.number().min(0, "Deve ser no mínimo 0").default(15),
  repeat: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
});

type FormData = z.infer<typeof formSchema>;

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: Reminder | null;
}

export function ReminderDialog({
  open,
  onOpenChange,
  reminder,
}: ReminderDialogProps) {
  const { toast } = useToast();
  const isEditing = !!reminder;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "exam_assignment",
      dueAt: "",
      remindBeforeMinutes: 15,
      repeat: "none",
    },
  });

  // Load existing data when editing
  useEffect(() => {
    if (reminder) {
      const dueDate = new Date(reminder.dueAt);
      const dateTimeString = dueDate.toISOString().slice(0, 16);
      
      form.reset({
        title: reminder.title,
        description: reminder.description || "",
        type: reminder.type as "exam_assignment" | "work_meeting",
        dueAt: dateTimeString,
        remindBeforeMinutes: reminder.remindBeforeMinutes,
        repeat: reminder.repeat as "none" | "daily" | "weekly" | "monthly",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        type: "exam_assignment",
        dueAt: "",
        remindBeforeMinutes: 15,
        repeat: "none",
      });
    }
  }, [reminder, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/reminders", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Lembrete criado!",
        description: "O lembrete foi criado com sucesso.",
      });
      onOpenChange(false);
      form.reset();
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
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PUT", `/api/reminders/${reminder?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Lembrete atualizado!",
        description: "O lembrete foi atualizado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Lembrete" : "Novo Lembrete"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do lembrete"
              : "Crie um novo lembrete de prova/trabalho ou reunião"}
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
                      placeholder="Adicione detalhes sobre o lembrete..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remindBeforeMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lembrar antes (minutos)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repeat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repetição</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a repetição" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Não repetir</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
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
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : isEditing
                  ? "Atualizar"
                  : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
