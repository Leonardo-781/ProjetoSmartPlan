import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateICS } from "./ics-generator";
import { insertReminderSchema } from "@shared/schema";

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
    
    const filters: { type?: string; start?: Date; end?: Date } = {};
    if (req.query.type) filters.type = req.query.type as string;
    if (req.query.start) filters.start = new Date(req.query.start as string);
    if (req.query.end) filters.end = new Date(req.query.end as string);
    
    const reminders = await storage.getReminders(uid, filters);
    res.json(reminders);
  });

  app.post("/api/reminders", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    
    try {
      // Validate request body
      const validatedData = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder({ ...validatedData, userId: uid });
      res.json(reminder);
    } catch (error: any) {
      return res.status(400).json({ detail: error.message || "Invalid reminder data" });
    }
  });

  app.get("/api/reminders/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    
    const reminder = await storage.getReminder(req.params.id);
    if (!reminder) {
      return res.status(404).json({ detail: "Reminder not found" });
    }
    if (reminder.userId !== uid) {
      return res.status(403).json({ detail: "Forbidden" });
    }
    res.json(reminder);
  });

  app.put("/api/reminders/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    
    const reminder = await storage.getReminder(req.params.id);
    if (!reminder) {
      return res.status(404).json({ detail: "Reminder not found" });
    }
    if (reminder.userId !== uid) {
      return res.status(403).json({ detail: "Forbidden" });
    }
    
    try {
      // Validate partial update
      const validatedData = insertReminderSchema.partial().parse(req.body);
      const updated = await storage.updateReminder(req.params.id, validatedData);
      res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ detail: error.message || "Invalid reminder data" });
    }
  });

  app.delete("/api/reminders/:id", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    
    const reminder = await storage.getReminder(req.params.id);
    if (!reminder) {
      return res.status(404).json({ detail: "Reminder not found" });
    }
    if (reminder.userId !== uid) {
      return res.status(403).json({ detail: "Forbidden" });
    }
    
    await storage.deleteReminder(req.params.id);
    res.json({ ok: true });
  });

  app.get("/api/reminders/:id/export.ics", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    
    const reminder = await storage.getReminder(req.params.id);
    if (!reminder) {
      return res.status(404).json({ detail: "Reminder not found" });
    }
    if (reminder.userId !== uid) {
      return res.status(403).json({ detail: "Forbidden" });
    }
    
    const icsContent = generateICS(reminder);
    const filename = `reminder-${reminder.id}.ics`;
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  });

  app.post("/api/reminders/dispatch", async (req: Request, res: Response) => {
    const uid = checkAuth(req, res);
    if (!uid) return;
    
    const now = new Date();
    const remindersToNotify = await storage.getRemindersForDispatch(now);
    
    const notified = [];
    for (const reminder of remindersToNotify) {
      // Check if already notified in this window
      const dueAt = new Date(reminder.dueAt);
      const notifyAt = new Date(dueAt.getTime() - reminder.remindBeforeMinutes * 60000);
      const windowEnd = new Date(dueAt.getTime() + 60000);
      
      const alreadyNotified = await storage.hasNotificationInWindow(
        reminder.id,
        notifyAt,
        windowEnd
      );
      
      if (!alreadyNotified) {
        await storage.createReminderNotification({ reminderId: reminder.id });
        console.log(`[REMINDER NOTIFICATION] ${reminder.type} - ${reminder.title} - Due: ${reminder.dueAt}`);
        notified.push({
          id: reminder.id,
          title: reminder.title,
          type: reminder.type,
          dueAt: reminder.dueAt,
        });
      }
    }
    
    res.json({
      dispatched_at: now.toISOString(),
      count: notified.length,
      reminders: notified,
    });
  });

  return httpServer;
}
