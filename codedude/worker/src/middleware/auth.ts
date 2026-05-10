import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createMiddleware } from 'hono/factory';
import type { Env, AppVariables } from '../types';



let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedJWKSUrl: string | null = null;

async function getJWKS(jwksUrl: string) {
    if (cachedJWKS && cachedJWKSUrl === jwksUrl) {
        return cachedJWKS;
    }

    cachedJWKS = createRemoteJWKSet(new URL(jwksUrl), {
        cooldownDuration: 30 * 1000, // 30 seconds cooldown before refreshing keys
        cacheMaxAge: 5 * 60 * 1000, // 5 minutes cache max age
    });
    cachedJWKSUrl = jwksUrl;

    return cachedJWKS;
}
export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Missing or invalid authorization header', code: 'MISSING_AUTH_HEADER' }, 401);
    }
    const token = authHeader.slice(7); // Remove "Bearer " prefix
    try {
        const jwks = await getJWKS(c.env.CLERK_JWKS_URL);
        const { payload } = await jwtVerify(token, jwks, {
            issuer: c.env.CLERK_ISSUER,
        });

        if (!payload.sub) {
            return c.json({ error: 'Invalid token payload', code: 'INVALID_TOKEN' }, 401);
        }

        const userId = payload.sub as string;
        if (!userId) {
            return c.json({ error: 'User ID not found in token', code: 'INVALID_TOKEN' }, 401);
        }
        c.set('userId', userId);
        await next();
    } catch (err) {
        return c.json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' }, 401);
    }
})