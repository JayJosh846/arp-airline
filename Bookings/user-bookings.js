const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient();

module.exports = { 
    
    getBookingDetails: async(context) => {

    const bookedFlight =  context.prisma.booked.findMany();

    return bookedFlight;
  }

}
//   module.exports = {
//     getBookingDetails
//   }


// const getBookingDetails = async() => {
//     const bookedFlight =  await prisma.booked.findMany();

//     // return bookedFlight;
//     console.log(bookedFlight);
// }

// getBookingDetails();