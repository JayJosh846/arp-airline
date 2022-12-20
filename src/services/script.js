const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

// write all your queries inside this function
async function main() {
  const allUsers = await prisma.user.findMany()
  console.log(allUsers)
}

// 4
main()
  .catch(e => {
    throw e
  })
  // 5
  .finally(async () => {
    await prisma.$disconnect()
  })
