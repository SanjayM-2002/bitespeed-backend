import { Prisma, PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Hono } from 'hono';
import { z } from 'zod';

export const contactRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
}>();

const identifySchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
});

contactRouter.get('/hello', async (c) => {
  return c.json({ msg: 'Hello world' });
});

contactRouter.post('/identify', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  try {
    const zodResponse = identifySchema.safeParse(body);
    if (!zodResponse.success) {
      c.status(411);
      return c.json({ error: zodResponse.error });
    }
    c.status(200);
    return c.json(zodResponse.data);
  } catch (error) {
    c.status(500);
    return c.json({ error: 'Server error' });
  }
});
