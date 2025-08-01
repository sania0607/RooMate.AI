import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { signUpSchema, signInSchema } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupSimpleAuth(app: Express) {
  // Simple session storage in memory
  const userSessions = new Map<string, string>(); // sessionId -> userId

  // Generate session ID
  function generateSessionId() {
    return randomBytes(32).toString('hex');
  }

  // Get user from session
  function getUserFromSession(req: any) {
    const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;
    if (!sessionId) return null;
    
    const userId = userSessions.get(sessionId);
    return userId || null;
  }

  // Get session ID from request
  function getSessionIdFromRequest(req: any) {
    return req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;
  }

  // Auth middleware
  const isAuthenticated = async (req: any, res: any, next: any) => {
    try {
      const userId = getUserFromSession(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error("Authentication middleware error:", error);
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration request body:", req.body);
      const validatedData = signUpSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      // Check if username already exists
      console.log("Checking for existing user with username:", validatedData.username);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        console.log("User already exists:", existingUser.username);
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      console.log("Hashing password...");
      const hashedPassword = await hashPassword(validatedData.password);
      console.log("Password hashed successfully");
      
      // Create user
      console.log("Creating user in database...");
      const user = await storage.createUser({
        username: validatedData.username,
        name: validatedData.name,
        password: hashedPassword,
      });
      console.log("User created successfully:", user.id);
      
      // Create session
      const sessionId = generateSessionId();
      userSessions.set(sessionId, user.id);
      
      // Set cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      console.log("User logged in successfully");
      res.status(201).json({ 
        message: "Account created successfully", 
        user: { id: user.id, username: user.username, name: user.name },
        sessionId
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error stack:", error.stack);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login request body:", req.body);
      const validatedData = signInSchema.parse(req.body);
      
      // Get user
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check password
      const isValidPassword = await comparePasswords(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Create session
      const sessionId = generateSessionId();
      userSessions.set(sessionId, user.id);
      
      // Set cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.json({ 
        message: "Login successful", 
        user: { id: user.id, username: user.username, name: user.name },
        sessionId
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    const sessionId = getSessionIdFromRequest(req);
    if (sessionId) {
      userSessions.delete(sessionId);
    }
    res.clearCookie('sessionId');
    res.json({ message: "Logged out successfully" });
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    try {
      const userId = getUserFromSession(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      res.json({ id: user.id, username: user.username, name: user.name });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Demo login endpoint for quick testing
  app.get("/api/auth/demo-login", async (req, res) => {
    try {
      // Get the demo user
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ message: "Demo user not found. Please create one first." });
      }
      
      // Create session
      const sessionId = generateSessionId();
      userSessions.set(sessionId, user.id);
      
      // Set cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.json({ 
        message: "Demo login successful", 
        user: { id: user.id, username: user.username, name: user.name },
        sessionId
      });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Demo login failed" });
    }
  });

  return { isAuthenticated };
}