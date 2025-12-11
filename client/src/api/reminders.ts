import type { Reminder } from "@shared/schema";

export interface ReminderFilters {
  type?: "exam_assignment" | "work_meeting";
  start?: string;
  end?: string;
}

export interface CreateReminderData {
  title: string;
  description?: string;
  type: "exam_assignment" | "work_meeting";
  dueAt: string;
  remindBeforeMinutes?: number;
  repeat?: "none" | "daily" | "weekly" | "monthly";
}

export interface UpdateReminderData {
  title?: string;
  description?: string;
  type?: "exam_assignment" | "work_meeting";
  dueAt?: string;
  remindBeforeMinutes?: number;
  repeat?: "none" | "daily" | "weekly" | "monthly";
}

const API_BASE = "/api/reminders";

export const remindersApi = {
  /**
   * Get all reminders with optional filters
   */
  async getReminders(filters?: ReminderFilters): Promise<Reminder[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.start) params.append("start", filters.start);
    if (filters?.end) params.append("end", filters.end);
    
    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
    const response = await fetch(url, {
      credentials: "include",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch reminders");
    }
    
    return response.json();
  },

  /**
   * Get a single reminder by ID
   */
  async getReminder(id: string): Promise<Reminder> {
    const response = await fetch(`${API_BASE}/${id}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch reminder");
    }
    
    return response.json();
  },

  /**
   * Create a new reminder
   */
  async createReminder(data: CreateReminderData): Promise<Reminder> {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create reminder");
    }
    
    return response.json();
  },

  /**
   * Update an existing reminder
   */
  async updateReminder(id: string, data: UpdateReminderData): Promise<Reminder> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update reminder");
    }
    
    return response.json();
  },

  /**
   * Delete a reminder
   */
  async deleteReminder(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete reminder");
    }
  },

  /**
   * Export a reminder as .ics file
   */
  async exportReminder(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}/export.ics`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to export reminder");
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reminder-${id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Trigger reminder dispatch manually
   */
  async dispatchReminders(): Promise<void> {
    const response = await fetch(`${API_BASE}/dispatch`, {
      method: "POST",
      credentials: "include",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to dispatch reminders");
    }
  },
};
