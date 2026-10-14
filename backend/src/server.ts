import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js"; // NEW
import foodRoutes from "./routes/foodRoutes.js"; // NEW
import orderRoutes from "./routes/orderRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import { uploadsDirectory } from "./services/imageStorage.js";

const app = express();
export default app;
const PORT = Number(process.env.PORT) || 5000;
let backendReady: Promise<void> | undefined;

function ensureBackendReady(): Promise<void> {
  if (!process.env.JWT_SECRET) {
    return Promise.reject(new Error("JWT_SECRET is not defined in environment variables"));
  }

  if (!backendReady) {
    backendReady = connectDB().catch((error: unknown) => {
      backendReady = undefined;
      throw error;
    });
  }

  return backendReady;
}

const allowedOrigins = [
  "https://quick-bite-sigma-eight.vercel.app",
  "https://quick-bite-a-565b.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to QuickBite API",
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "QuickBite API is running",
  });
});

app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await ensureBackendReady();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes); // NEW
app.use("/api/foods", foodRoutes); // NEW
app.use("/api/orders", orderRoutes);
app.use("/api/images", imageRoutes);
app.use(
  "/uploads",
  express.static(uploadsDirectory, {
    fallthrough: false,
    maxAge: "1d",
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);

// 404 for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Central error handler (must keep 4 parameters)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    res.status(400).json({ success: false, message: "Malformed JSON in request body" });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

async function startServer(): Promise<void> {
  try {
    await ensureBackendReady();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  void startServer();
}