import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { Reminder } from "@shared/schema";
import type { CreateReminderData } from "@/api/reminders";

interface ReminderFormProps {
  initialData?: Reminder;
  onSubmit: (data: CreateReminderData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function isValidReminderType(value: string): value is "exam_assignment" | "work_meeting" {
  return value === "exam_assignment" || value === "work_meeting";
}

function isValidRepeatType(value: string): value is "none" | "daily" | "weekly" | "monthly" {
  return value === "none" || value === "daily" || value === "weekly" || value === "monthly";
}

export function ReminderForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ReminderFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [type, setType] = useState<"exam_assignment" | "work_meeting">(
    (initialData?.type && isValidReminderType(initialData.type)) ? initialData.type : "exam_assignment"
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialData?.dueAt ? new Date(initialData.dueAt) : undefined
  );
  const [dueTime, setDueTime] = useState(
    initialData?.dueAt
      ? format(new Date(initialData.dueAt), "HH:mm")
      : "09:00"
  );
  const [remindBeforeMinutes, setRemindBeforeMinutes] = useState(
    initialData?.remindBeforeMinutes?.toString() || "30"
  );
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "monthly">(
    (initialData?.repeat && isValidRepeatType(initialData.repeat)) ? initialData.repeat : "none"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return; // Form validation will handle this
    }
    
    if (!dueDate) {
      return; // Form validation will handle this
    }
    
    const [hours, minutes] = dueTime.split(":").map(Number);
    const dueAtDate = new Date(dueDate);
    dueAtDate.setHours(hours, minutes, 0, 0);
    
    const data: CreateReminderData = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      dueAt: dueAtDate.toISOString(),
      remindBeforeMinutes: parseInt(remindBeforeMinutes) || 30,
      repeat,
    };
    
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Prova de Cálculo"
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select 
          value={type} 
          onValueChange={(v) => {
            if (isValidReminderType(v)) {
              setType(v);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exam_assignment">Prova/Trabalho</SelectItem>
            <SelectItem value="work_meeting">Trabalho/Reunião</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição opcional do lembrete"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Data de Vencimento *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="dueTime">Horário</Label>
          <Input
            id="dueTime"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="remindBefore">Lembrar com antecedência (minutos)</Label>
        <Input
          id="remindBefore"
          type="number"
          min="0"
          value={remindBeforeMinutes}
          onChange={(e) => setRemindBeforeMinutes(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="repeat">Repetir</Label>
        <Select 
          value={repeat} 
          onValueChange={(v) => {
            if (isValidRepeatType(v)) {
              setRepeat(v);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Não repetir</SelectItem>
            <SelectItem value="daily">Diariamente</SelectItem>
            <SelectItem value="weekly">Semanalmente</SelectItem>
            <SelectItem value="monthly">Mensalmente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
