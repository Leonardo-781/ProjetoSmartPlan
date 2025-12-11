import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, Download, Clock, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Reminder } from "@shared/schema";

interface ReminderListProps {
  reminders: Reminder[];
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

const typeLabels = {
  exam_assignment: "Prova/Trabalho",
  work_meeting: "Trabalho/Reunião",
};

const repeatLabels = {
  none: "Não repete",
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

export function ReminderList({
  reminders,
  onEdit,
  onDelete,
  onExport,
}: ReminderListProps) {
  if (reminders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">Nenhum lembrete cadastrado</p>
        <p className="text-sm">Clique em "Novo Lembrete" para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => {
        const dueDate = reminder.dueAt ? new Date(reminder.dueAt) : null;
        const isPast = dueDate && dueDate < new Date();
        
        return (
          <Card key={reminder.id} className={isPast ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{reminder.title}</h3>
                      {reminder.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {reminder.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {typeLabels[reminder.type as keyof typeof typeLabels]}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {dueDate
                          ? format(dueDate, "PPP 'às' HH:mm", { locale: ptBR })
                          : "Sem data"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Bell className="h-4 w-4" />
                      <span>
                        {reminder.remindBeforeMinutes || 0} min antes
                      </span>
                    </div>

                    {reminder.repeat !== "none" && (
                      <Badge variant="secondary" className="text-xs">
                        {repeatLabels[reminder.repeat as keyof typeof repeatLabels]}
                      </Badge>
                    )}

                    {isPast && (
                      <Badge variant="destructive" className="text-xs">
                        Vencido
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onExport(reminder.id)}
                    title="Exportar como .ics"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(reminder)}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(reminder.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
