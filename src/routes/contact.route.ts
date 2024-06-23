import { PrismaClient } from '@prisma/client/edge';
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

  try {
    const body = await c.req.json();
    const zodResponse = identifySchema.safeParse(body);
    if (!zodResponse.success) {
      c.status(400);
      return c.json({ error: zodResponse.error });
    }
    const { email, phoneNumber } = zodResponse.data;

    const existingContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { email: email ?? undefined },
          { phoneNumber: phoneNumber ?? undefined },
        ],
      },
    });
    console.log('existing contacts: ', existingContacts);
    let primaryContact;
    let secondaryContactIds = [];

    if (existingContacts.length === 0) {
      console.log('inside if');
      primaryContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'primary',
        },
      });
    } else {
      console.log('inside else block');
      primaryContact =
        existingContacts.find(
          (contact) => contact.linkPrecedence === 'primary'
        ) || existingContacts[0];
      console.log('primary contact: ', primaryContact);
      if (primaryContact.linkPrecedence !== 'primary') {
        primaryContact = await prisma.contact.update({
          where: { id: primaryContact.id },
          data: { linkPrecedence: 'primary' },
        });
      }

      for (const contact of existingContacts) {
        if (contact.id !== primaryContact.id) {
          if (contact.linkPrecedence === 'primary') {
            await prisma.contact.update({
              where: { id: contact.id },
              data: {
                linkPrecedence: 'secondary',
                linkedId: primaryContact.id,
              },
            });
          }
          secondaryContactIds.push(contact.id);
        }
      }

      if (
        !existingContacts.some(
          (contact) =>
            contact.email === email && contact.phoneNumber === phoneNumber
        )
      ) {
        const newContact = await prisma.contact.create({
          data: {
            email,
            phoneNumber,
            linkPrecedence: 'secondary',
            linkedId: primaryContact.id,
          },
        });
        secondaryContactIds.push(newContact.id);
      }
    }
    const allContacts = await prisma.contact.findMany({
      where: {
        OR: [{ id: primaryContact.id }, { linkedId: primaryContact.id }],
      },
    });

    const emails = [
      ...new Set(allContacts.map((contact) => contact.email).filter(Boolean)),
    ];
    const phoneNumbers = [
      ...new Set(
        allContacts.map((contact) => contact.phoneNumber).filter(Boolean)
      ),
    ];
    const secondaryIds = allContacts
      .filter((contact) => contact.linkPrecedence === 'secondary')
      .map((contact) => contact.id);

    const response = {
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryIds,
      },
    };

    c.status(200);
    return c.json(response);
  } catch (error) {
    console.error('Server error: ', error);
    c.status(500);
    return c.json({ error: 'Server error' });
  } finally {
    await prisma.$disconnect();
  }
});
