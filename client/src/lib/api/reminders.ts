import { apiRequest } from "../queryClient";
import { type Reminder } from "@shared/schema";

export interface ReminderFilters {
  type?: string;
  start?: string;
  end?: string;
}

export async function getReminders(filters?: ReminderFilters): Promise<Reminder[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.append("type", filters.type);
  if (filters?.start) params.append("start", filters.start);
  if (filters?.end) params.append("end", filters.end);
  
  const url = `/api/reminders${params.toString() ? `?${params}` : ""}`;
  const res = await apiRequest("GET", url);
  return res.json();
}

export async function getReminder(id: number): Promise<Reminder> {
  const res = await apiRequest("GET", `/api/reminders/${id}`);
  return res.json();
}

export async function createReminder(data: Partial<Reminder>): Promise<Reminder> {
  const res = await apiRequest("POST", "/api/reminders", data);
  return res.json();
}

export async function updateReminder(id: number, data: Partial<Reminder>): Promise<Reminder> {
  const res = await apiRequest("PUT", `/api/reminders/${id}`, data);
  return res.json();
}

export async function deleteReminder(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/reminders/${id}`);
}

export async function exportReminderICS(id: number): Promise<Blob> {
  const res = await fetch(`/api/reminders/${id}/export.ics`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to export ICS: ${res.statusText}`);
  }
  return res.blob();
}

export async function dispatchReminders(): Promise<{ success: boolean; processed: number; notified: number }> {
  const res = await apiRequest("POST", "/api/reminders/dispatch");
  return res.json();
}
