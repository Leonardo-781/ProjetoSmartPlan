import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Reminder } from "@shared/schema";

interface ReminderCalendarProps {
  reminders: Reminder[];
}

export function ReminderCalendar({ reminders }: ReminderCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const remindersOnSelectedDate = reminders.filter((reminder) => {
    if (!reminder.dueAt || !selectedDate) return false;
    const dueDate = new Date(reminder.dueAt);
    return isSameDay(dueDate, selectedDate);
  });

  const datesWithReminders = reminders
    .filter((r) => r.dueAt)
    .map((r) => new Date(r.dueAt));

  const modifiers = {
    hasReminder: datesWithReminders,
  };

  const modifiersStyles = {
    hasReminder: {
      fontWeight: "bold",
      textDecoration: "underline",
      color: "#3b82f6",
    },
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Lembretes</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Lembretes em {format(selectedDate, "PPP", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {remindersOnSelectedDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum lembrete nesta data
              </p>
            ) : (
              <div className="space-y-3">
                {remindersOnSelectedDate.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="border-l-4 border-blue-500 pl-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reminder.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {reminder.type === "exam_assignment"
                          ? "Prova/Trabalho"
                          : "Trabalho/Reunião"}
                      </Badge>
                    </div>
                    {reminder.dueAt && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(reminder.dueAt), "HH:mm")}
                      </p>
                    )}
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {reminder.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
