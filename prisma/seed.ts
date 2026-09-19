import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@websiteswithpunch.com";
  const password = await bcrypt.hash("demo12345", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo User",
      password,
      plan: "free",
    },
  });

  const existing = await prisma.site.findFirst({
    where: { userId: user.id, url: "https://example.com" },
  });

  if (!existing) {
    await prisma.site.create({
      data: {
        userId: user.id,
        name: "Example.com",
        url: "https://example.com",
        status: "pending",
      },
    });
  }

  console.log("Seed complete.");
  console.log("Demo login: demo@websiteswithpunch.com / demo12345");
  console.log("Open /dashboard after logging in, then click Recheck on the demo site.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
