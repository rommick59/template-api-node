import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
const prisma = new PrismaClient()

async function main() {
  await prisma.user.deleteMany()
  await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name='User'`

  const cryptedPassword = await bcrypt.hash('admin', 10)
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@gmail.com',
        password: cryptedPassword,
      },
    ],
  })
}

main()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
