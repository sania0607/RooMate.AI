import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, signUpSchema, signInSchema } from "@shared/schema";
import MemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

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

export async function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Allow non-HTTPS in development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          
          if (!user || !user.password) {
            return done(null, false, { message: "Invalid username or password" });
          }
          
          const isValidPassword = await comparePasswords(password, user.password);
          
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid username or password" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(null, false);
    }
  });

  // Auth routes
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
      
      // Log in the user
      console.log("Logging in user...");
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        console.log("User logged in successfully");
        res.status(201).json({ message: "Account created successfully", user });
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

  app.post("/api/auth/login", (req, res, next) => {
    try {
      const validatedData = signInSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.status(500).json({ message: "Authentication failed" });
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return res.status(500).json({ message: "Login failed" });
          }
          res.json({ message: "Login successful", user });
        });
      })(req, res, next);
    } catch (error: any) {
      console.error("Login validation error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Failed to log out");
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  try {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};