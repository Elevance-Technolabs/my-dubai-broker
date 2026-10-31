import cors from "cors";
import type { Express } from "express";
import express from "express";
import helmet from "helmet";
import { env } from "./lib/env.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";
import router from "./routes.js";

const app: Express = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(express.json({ limit: "5mb" }));

// Middleware
app.use(
	cors({
		origin: env.CORS_ORIGINS,
		credentials: true,
		// Lets the browser read the bearer token issued on sign-in (see the
		// bearer() plugin in lib/auth.ts).
		exposedHeaders: ["set-auth-token"],
	}),
);

app.use("/api", router);

app.use(globalErrorHandler);

export default app;
