const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  validateId: async (args, context) => {
    return Number(args.id) === context?.airlineId;
  },

  getAirlineById: async (context) => {
    const airline = context.prisma.airline.findUnique({
      where: { id: context.airlineId },
    });
    // console.log('airline', airline);
    return airline;
  },

  // getFlightById: async (context) => {
  //   const flight = context.prisma.flight.findUnique({
  //     where: { id: context.airlineId },
  //   });
  //   console.log('airline', airline);
  //   return airline;
  // },
  isEmailOrMobileExist: async (args, context) => {
    return await context.prisma.airline.findUnique({
      where: {
        emailMobile: {
          email: args.email,
          mobile: args.mobile,
        },
      },
    });
  },
};
