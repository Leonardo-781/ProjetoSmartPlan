import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const { email, first_name, last_name, password } = req.body;
    const normalizedEmail = (email || "").toLowerCase();
    if (!normalizedEmail.endsWith("@ufu.br")) {
      return res.status(400).json({ detail: "Only @ufu.br emails allowed" });
    }
    // Validação de complexidade de senha
    const complex = typeof password === "string"
      && password.length >= 8
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /[0-9]/.test(password)
      && /[^A-Za-z0-9]/.test(password);
    if (!complex) {
      return res.status(400).json({ detail: "Senha inválida: mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo." });
    }
    // Checagem de email existente com normalização
    const existing = await storage.getUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ detail: "Email already registered" });
    }
    const user = await storage.createUser({
      email: normalizedEmail,
      password,
      firstName: first_name,
      lastName: last_name,
    });
    if (req.session) {
      req.session.user = { id: user.id, email: user.email };
    }
    // Nunca retornar senha
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").toLowerCase();
    if (!normalizedEmail.endsWith("@ufu.br")) {
      return res.status(400).json({ detail: "Only @ufu.br emails allowed" });
    }
    if (!password) {
      return res.status(400).json({ detail: "Password is required" });
    }
    const user = await storage.validatePassword(normalizedEmail, password);
    if (!user) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }
    if (req.session) {
      req.session.user = { id: user.id, email: user.email };
    }
    // Nunca retornar senha
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (!req.session?.user?.id) {
      return res.status(401).json({ detail: "Unauthorized" });
    }
    res.json(req.session.user);
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy(() => {
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });

  const checkAuth = (req: Request, res: Response) => {
    if (!req.session?.user?.id) {
      res.status(401).json({ detail: "Unauthorized" });
      return null;
    }
    return req.session.user.id;
  };

  // Disciplines
  app.get("/api/disciplines", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const disciplines = await storage.getDisciplines(uid);
    res.json(disciplines);
  });

  app.post("/api/disciplines", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const discipline = await storage.createDiscipline({ ...req.body, userId: uid });
    res.json(discipline);
  });

  app.patch("/api/disciplines/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const discipline = await storage.updateDiscipline(parseInt(req.params.id), req.body);
    res.json(discipline);
  });

  app.delete("/api/disciplines/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    await storage.deleteDiscipline(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Events
  app.get("/api/events", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const events = await storage.getEvents(uid);
    res.json(events);
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const event = await storage.createEvent({ ...req.body, userId: uid });
    res.json(event);
  });

  app.patch("/api/events/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const event = await storage.updateEvent(parseInt(req.params.id), req.body);
    res.json(event);
  });

  app.delete("/api/events/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    await storage.deleteEvent(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Tasks
  app.get("/api/tasks", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const tasks = await storage.getTasks(uid);
    res.json(tasks);
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const task = await storage.createTask({ ...req.body, userId: uid });
    res.json(task);
  });

  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const task = await storage.updateTask(parseInt(req.params.id), req.body);
    res.json(task);
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    await storage.deleteTask(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Goals
  app.get("/api/goals", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const goals = await storage.getGoals(uid);
    res.json(goals);
  });

  app.post("/api/goals", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const goal = await storage.createGoal({ ...req.body, userId: uid });
    res.json(goal);
  });

  app.patch("/api/goals/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const goal = await storage.updateGoal(parseInt(req.params.id), req.body);
    res.json(goal);
  });

  app.delete("/api/goals/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    await storage.deleteGoal(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Reminders
  app.get("/api/reminders", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const filters: { type?: string; startDate?: Date; endDate?: Date } = {};
    if (req.query.type) filters.type = req.query.type as string;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
    const reminders = await storage.getReminders(uid, filters);
    res.json(reminders);
  });

  const VALID_REMINDER_TYPES = ["exam_assignment", "work_meeting"];

  app.post("/api/reminders", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const { title, type, dueAt, remindBeforeMinutes, description, repeat } = req.body;
    
    // Validation
    if (!title || !type || !dueAt) {
      return res.status(400).json({ detail: "Title, type, and dueAt are required" });
    }
    
    if (!VALID_REMINDER_TYPES.includes(type)) {
      return res.status(400).json({ detail: "Invalid type. Must be 'exam_assignment' or 'work_meeting'" });
    }
    
    if (remindBeforeMinutes !== undefined && (remindBeforeMinutes < 0 || !Number.isInteger(remindBeforeMinutes))) {
      return res.status(400).json({ detail: "remindBeforeMinutes must be a non-negative integer" });
    }
    
    const reminder = await storage.createReminder({ 
      ...req.body, 
      userId: uid,
      dueAt: new Date(dueAt)
    });
    res.json(reminder);
  });

  app.get("/api/reminders/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const reminder = await storage.getReminder(parseInt(req.params.id));
    if (!reminder) {
      return res.status(404).json({ detail: "Reminder not found" });
    }
    if (reminder.userId !== uid) {
      return res.status(403).json({ detail: "Access denied" });
    }
    res.json(reminder);
  });

  app.put("/api/reminders/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const existing = await storage.getReminder(parseInt(req.params.id));
    if (!existing) {
      return res.status(404).json({ detail: "Reminder not found" });
    }
    if (existing.userId !== uid) {
      return res.status(403).json({ detail: "Access denied" });
    }
    
    // Validation
    if (req.body.type && !VALID_REMINDER_TYPES.includes(req.body.type)) {
      return res.status(400).json({ detail: "Invalid type. Must be 'exam_assignment' or 'work_meeting'" });
    }
    
    if (req.body.remindBeforeMinutes !== undefined && (req.body.remindBeforeMinutes < 0 || !Number.isInteger(req.body.remindBeforeMinutes))) {
      return res.status(400).json({ detail: "remindBeforeMinutes must be a non-negative integer" });
    }
    
    if (req.body.dueAt) {
      req.body.dueAt = new Date(req.body.dueAt);
    }
    
    const reminder = await storage.updateReminder(parseInt(req.params.id), req.body);
    res.json(reminder);
  });

  app.delete("/api/reminders/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const existing = await storage.getReminder(parseInt(req.params.id));
    if (!existing) {
      return res.status(404).json({ detail: "Reminder not found" });
    }
    if (existing.userId !== uid) {
      return res.status(403).json({ detail: "Access denied" });
    }
    await storage.deleteReminder(parseInt(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/reminders/:id/export.ics", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    const reminder = await storage.getReminder(parseInt(req.params.id));
    if (!reminder) {
      return res.status(404).json({ detail: "Reminder not found" });
    }
    if (reminder.userId !== uid) {
      return res.status(403).json({ detail: "Access denied" });
    }
    
    // Generate ICS file content
    const dueDate = new Date(reminder.dueAt);
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    // Escape special characters for ICS format (RFC 5545)
    const escapeICS = (text: string) => {
      return text.replace(/\\/g, '\\\\')
                 .replace(/;/g, '\\;')
                 .replace(/,/g, '\\,')
                 .replace(/\n/g, '\\n');
    };
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ProjetoSmartPlan//Reminders//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:reminder-${reminder.id}@projetosmartplan`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(dueDate)}`,
      `SUMMARY:${escapeICS(reminder.title)}`,
      reminder.description ? `DESCRIPTION:${escapeICS(reminder.description)}` : '',
      `CATEGORIES:${reminder.type === 'exam_assignment' ? 'Prova/Trabalho' : 'Reunião de Trabalho'}`,
      reminder.remindBeforeMinutes ? `BEGIN:VALARM\nACTION:DISPLAY\nDESCRIPTION:${escapeICS(reminder.title)}\nTRIGGER:-PT${reminder.remindBeforeMinutes}M\nEND:VALARM` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line).join('\r\n');
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="reminder-${reminder.id}.ics"`);
    res.send(icsContent);
  });

  app.post("/api/reminders/dispatch", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    
    const pendingReminders = await storage.getPendingReminders();
    const userReminders = pendingReminders.filter(r => r.userId === uid);
    
    // Mark as notified and prepare notification messages
    const notifications = [];
    for (const reminder of userReminders) {
      await storage.markReminderNotified(reminder.id);
      notifications.push({
        id: reminder.id,
        title: reminder.title,
        type: reminder.type,
        dueAt: reminder.dueAt,
        message: `Lembrete: ${reminder.title} - ${reminder.type === 'exam_assignment' ? 'Prova/Trabalho' : 'Reunião'} em ${new Date(reminder.dueAt).toLocaleString('pt-BR')}`
      });
    }
    
    res.json({
      count: notifications.length,
      notifications
    });
  });

  return httpServer;
}
