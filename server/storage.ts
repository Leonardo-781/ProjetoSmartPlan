import { type User, type Discipline, type Event, type Task, type StudyGoal, type Reminder, type ReminderNotification } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  validatePassword(email: string, password: string): Promise<User | null>;
  
  // Disciplines
  getDisciplines(userId: string): Promise<Discipline[]>;
  createDiscipline(discipline: Partial<Discipline>): Promise<Discipline>;
  updateDiscipline(id: number, data: Partial<Discipline>): Promise<Discipline>;
  deleteDiscipline(id: number): Promise<void>;
  
  // Events
  getEvents(userId: string): Promise<Event[]>;
  createEvent(event: Partial<Event>): Promise<Event>;
  updateEvent(id: number, data: Partial<Event>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  
  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  createTask(task: Partial<Task>): Promise<Task>;
  updateTask(id: number, data: Partial<Task>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  
  // Study Goals
  getGoals(userId: string): Promise<StudyGoal[]>;
  createGoal(goal: Partial<StudyGoal>): Promise<StudyGoal>;
  updateGoal(id: number, data: Partial<StudyGoal>): Promise<StudyGoal>;
  deleteGoal(id: number): Promise<void>;
  
  // Reminders
  getReminders(ownerEmail: string, filters?: { type?: string; start?: Date; end?: Date }): Promise<Reminder[]>;
  getReminder(id: string): Promise<Reminder | undefined>;
  createReminder(reminder: Partial<Reminder>): Promise<Reminder>;
  updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
  getRemindersForDispatch(now: Date): Promise<Reminder[]>;
  createReminderNotification(notification: Partial<ReminderNotification>): Promise<ReminderNotification>;
  getReminderNotifications(reminderId: string): Promise<ReminderNotification[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private disciplines: Map<number, Discipline> = new Map();
  private events: Map<number, Event> = new Map();
  private tasks: Map<number, Task> = new Map();
  private goals: Map<number, StudyGoal> = new Map();
  private reminders: Map<string, Reminder> = new Map();
  private reminderNotifications: Map<string, ReminderNotification> = new Map();
  private nextDisciplineId = 1;
  private nextEventId = 1;
  private nextTaskId = 1;
  private nextGoalId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === email.toLowerCase());
  }

  async createUser(data: Partial<User>): Promise<User> {
    const hashedPassword = data.password 
      ? await bcrypt.hash(data.password, 10)
      : await bcrypt.hash("", 10);
    const user: User = {
      id: randomUUID(),
      email: data.email || "",
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      profileImageUrl: data.profileImageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getDisciplines(userId: string): Promise<Discipline[]> {
    return Array.from(this.disciplines.values()).filter((d) => d.userId === userId);
  }

  async createDiscipline(data: Partial<Discipline>): Promise<Discipline> {
    const discipline: Discipline = {
      id: this.nextDisciplineId++,
      userId: data.userId || "",
      name: data.name || "",
      code: data.code,
      professor: data.professor,
      semester: data.semester,
      color: data.color || "#3B82F6",
      createdAt: new Date(),
    };
    this.disciplines.set(discipline.id, discipline);
    return discipline;
  }

  async updateDiscipline(id: number, data: Partial<Discipline>): Promise<Discipline> {
    const discipline = this.disciplines.get(id);
    if (!discipline) throw new Error("Not found");
    const updated = { ...discipline, ...data };
    this.disciplines.set(id, updated);
    return updated;
  }

  async deleteDiscipline(id: number): Promise<void> {
    this.disciplines.delete(id);
  }

  async getEvents(userId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter((e) => e.userId === userId);
  }

  async createEvent(data: Partial<Event>): Promise<Event> {
    const event: Event = {
      id: this.nextEventId++,
      userId: data.userId || "",
      disciplineId: data.disciplineId,
      title: data.title || "",
      description: data.description,
      eventType: data.eventType || "aula",
      startDate: data.startDate || "",
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      isRecurring: data.isRecurring || false,
      recurrencePattern: data.recurrencePattern,
      recurrenceDays: data.recurrenceDays,
      recurrenceEndDate: data.recurrenceEndDate,
      createdAt: new Date(),
    };
    this.events.set(event.id, event);
    return event;
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const event = this.events.get(id);
    if (!event) throw new Error("Not found");
    const updated = { ...event, ...data };
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    this.events.delete(id);
  }

  async getTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((t) => t.userId === userId);
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    const task: Task = {
      id: this.nextTaskId++,
      userId: data.userId || "",
      disciplineId: data.disciplineId,
      title: data.title || "",
      description: data.description,
      priority: data.priority || "medium",
      status: data.status || "todo",
      dueDate: data.dueDate,
      completedAt: data.completedAt,
      createdAt: new Date(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error("Not found");
    const updated = { ...task, ...data };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    this.tasks.delete(id);
  }

  async getGoals(userId: string): Promise<StudyGoal[]> {
    return Array.from(this.goals.values()).filter((g) => g.userId === userId);
  }

  async createGoal(data: Partial<StudyGoal>): Promise<StudyGoal> {
    const goal: StudyGoal = {
      id: this.nextGoalId++,
      userId: data.userId || "",
      title: data.title || "",
      targetHours: data.targetHours || 0,
      periodType: data.periodType || "weekly",
      currentHours: data.currentHours || 0,
      createdAt: new Date(),
    };
    this.goals.set(goal.id, goal);
    return goal;
  }

  async updateGoal(id: number, data: Partial<StudyGoal>): Promise<StudyGoal> {
    const goal = this.goals.get(id);
    if (!goal) throw new Error("Not found");
    const updated = { ...goal, ...data };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: number): Promise<void> {
    this.goals.delete(id);
  }

  async getReminders(ownerEmail: string, filters?: { type?: string; start?: Date; end?: Date }): Promise<Reminder[]> {
    let reminders = Array.from(this.reminders.values()).filter((r) => r.ownerEmail === ownerEmail);
    
    if (filters?.type) {
      reminders = reminders.filter((r) => r.type === filters.type);
    }
    if (filters?.start) {
      reminders = reminders.filter((r) => r.dueAt && r.dueAt >= filters.start!);
    }
    if (filters?.end) {
      reminders = reminders.filter((r) => r.dueAt && r.dueAt <= filters.end!);
    }
    
    return reminders;
  }

  async getReminder(id: string): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async createReminder(data: Partial<Reminder>): Promise<Reminder> {
    const reminder: Reminder = {
      id: randomUUID(),
      ownerEmail: data.ownerEmail || "",
      type: data.type || "exam_assignment",
      title: data.title || "",
      description: data.description,
      dueAt: data.dueAt || new Date(),
      remindBeforeMinutes: data.remindBeforeMinutes ?? 30,
      repeat: data.repeat || "none",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  async updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder> {
    const reminder = this.reminders.get(id);
    if (!reminder) throw new Error("Not found");
    const updated = { ...reminder, ...data, updatedAt: new Date() };
    this.reminders.set(id, updated);
    return updated;
  }

  async deleteReminder(id: string): Promise<void> {
    this.reminders.delete(id);
  }

  async getRemindersForDispatch(now: Date): Promise<Reminder[]> {
    const ONE_MINUTE_MS = 60 * 1000;
    return Array.from(this.reminders.values()).filter((r) => {
      if (!r.dueAt) return false;
      const remindTime = new Date(r.dueAt.getTime() - r.remindBeforeMinutes * ONE_MINUTE_MS);
      const windowEnd = new Date(r.dueAt.getTime() + ONE_MINUTE_MS);
      return remindTime <= now && now < windowEnd;
    });
  }

  async createReminderNotification(data: Partial<ReminderNotification>): Promise<ReminderNotification> {
    const notification: ReminderNotification = {
      id: randomUUID(),
      reminderId: data.reminderId || "",
      notifiedAt: new Date(),
    };
    this.reminderNotifications.set(notification.id, notification);
    return notification;
  }

  async getReminderNotifications(reminderId: string): Promise<ReminderNotification[]> {
    return Array.from(this.reminderNotifications.values()).filter((n) => n.reminderId === reminderId);
  }
}

export const storage = new MemStorage();
