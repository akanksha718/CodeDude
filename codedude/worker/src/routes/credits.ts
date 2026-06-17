
import { Hono } from "hono";
import { Env, AppVariables } from "../types";
import { getCredits, UserCredits } from "../services/credits";

const creditsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();


creditsRoutes.get("/",async(c)=>{
    const userId=c.var.userId;
    const credits =  await getCredits(userId, c.env);
    return c.json({
        remaining: credits.remaining,
        total: credits.total,
        plan: credits.plan,
        periodStart: credits.periodStart,
        periodEnd: credits.periodEnd,
        isUnlimited: credits.remaining === -1
    });

});




export { creditsRoutes };