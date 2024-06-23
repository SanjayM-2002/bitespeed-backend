import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { cors } from 'hono/cors';
import { contactRouter } from './routes/contact.route';

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
}>();
app.use('/*', cors());
app.route('/api/v1', contactRouter);

export default app;
