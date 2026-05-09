import { Hono } from 'hono';
import { AppVariables, Env } from './types';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import { projectRoutes } from './routes/project';


const app=new Hono<{Bindings:Env, Variables:AppVariables}>();

app.use("*",async (c, next) => {
    const allowedOrigins = c.env.FRONTEND_URL || "http://localhost:3000";
    const middleware = cors({
        origin : [allowedOrigins],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
        allowHeaders: ["Content-Type", "Authorization"],
        maxAge: 600,
        credentials: true
    });
    return middleware(c, next);
});

app.use("/api/*",authMiddleware);
app.get("/api/health", (c) => {
    return c.json({ status: "ok" ,timestamp: new Date().toISOString()});
});
app.route("/api/projects", projectRoutes);

// Redirect root to frontend (or serve a simple message)
app.get('/', (c) => {
    const frontend = c.env.FRONTEND_URL || 'http://localhost:3000';
    c.header('Location', frontend);
    return c.text(`Redirecting to ${frontend}`, 302);
});





export default app;