const { validateId, getAirlineById } = require("../utils/utils");
const {  balanceOf } = require('../../web3.services/setter');


function allPassengers(parent, args, context) {
  return context.prisma.airline.findMany({
    where: { role: "PASSENGER" },
  });
}

function allAirlineAdmins(parent, args, context) {
  return context.prisma.airline.findMany({
    where: { role: "AIRLINE" },
  }); 
}

function allAeropayeAdmins(parent, args, context) {
  return context.prisma.airline.findMany({
    where: { role: "ADMIN" },
  });
}

// const getAirlineById = async (parent, args, context) => {
//   const result = await validateId(args, context);
//   if (!result) return null;
//   return context.prisma.airline.findUnique({
//     where: { id: context?.airlineId }, 
//   });
// };

const getAirlineFlights = async (parent, args, context) => {
  const airlineDetails = await getAirlineById(context);

  const flight = await context.prisma.flight.findMany(
    {
      where: {
        airlineId: airlineDetails.id
      }
    }
  );
  return flight
};

async function getBookedFlight(parent, args, context, info) {
  // let options = args.airlineName ? { status: args.status, airlineName: args.airlineName } : { status: args.status }

  const airlineDetails = await getAirlineById(context);
  const flight = await context.prisma.booked.findMany(
    {
      where: {
        airlineId: airlineDetails.id, 
        flightCode: args.flightCode
      }
    }
  );
  return flight
}

async function verifyEmailToken(parent, args, context, info) {
  const password = await bcrypt.hash(args.password, 10);
  const user = await context.prisma.airline.create({
    data: { ...args, password },
  });
  const token = jwt.sign({ userId: user.id }, APP_SECRET);
  return {
    token,
    user,
  };  
}

async function balance(parent, args, context, info) {
  const userDetails = await getAirlineById(context);

  const escrowTransfer = await balanceOf(userDetails.addr);

  return {
    status: "success",
    data: escrowTransfer
  }
}

async function airlineClaims(parent, args, context, info) {

  const airlineDetails = await getAirlineById(context);
  const flight = await context.prisma.airlineclaim.findMany(
    {
      where: {
        airlineId: airlineDetails.id, 
        flightCode: args.flightCode
      }
    }
  );

  let acct = flight.map(a => a);

  const found = acct.find(({ flightCode }) => flightCode === args.flightCode);

  return found

  return found
}   

async function cancelAndCheckInCount(parent, args, context, info) {

  const airlineDetails = await getAirlineById(context);
  const flight = await context.prisma.flight.findMany(
    {
      where: {
        airlineId: airlineDetails.id, 
        flightCode: args.flightCode
      }
    }
  );

  let acct = flight.map(a => a);

  const found = acct.find(({ flightCode }) => flightCode === args.flightCode);

  return found
}

async function airlineBankDetails(parent, args, context, info) {
  const airline = await getAirlineById(context);

  return context.prisma.airlinesbanklist.findMany({
    where: { airlineId: airline.id }, 
  });  
}

async function getAllCancellations(parent, args, context, info) {
  // let options = args.airlineName ? { status: args.status, airlineName: args.airlineName } : { status: args.status }

  const airlineDetails = await getAirlineById(context);
  const flight = await context.prisma.passengercancel.findMany(
    {
      where: {
        airlineId: airlineDetails.id, 
      }
    }
  );
  return flight
}

async function getCancellationsByFlight(parent, args, context, info) {
  // let options = args.airlineName ? { status: args.status, airlineName: args.airlineName } : { status: args.status }

  const airlineDetails = await getAirlineById(context);
  const flight = await context.prisma.passengercancel.findMany(
    {
      where: {
        airlineId: airlineDetails.id, 
        flightCode: args.flightCode
      }
    }
  );
  return flight
}


async function totalAmountRefundedByAirline(parent, args, context, info) {
 
  const airlineDetails = await getAirlineById(context); 

  const airlineCancel = await context.prisma.passengercancel.findMany(
    {
      where: {
        airlineId: airlineDetails.id, 
      }
    }
  );

  let cancelRefunds = airlineCancel.map(a => a.amountRefunded);
  console.log(cancelRefunds);

  let balance;
  let sum = 0; 
  let array = [];

  for (let i = 0; i < cancelRefunds.length; i++) {
    sum += Math.floor(cancelRefunds[i]);

  }
  return sum;

}

async function airlinesRefund(parent, args, context, info) {
  const airlineDetails = await getAirlineById(context);

  return context.prisma.airlinerefunds.findMany(
    {
      where: {
        airlineId: airlineDetails.id, 
      }  }
  );  
} 

module.exports = {
  allPassengers,
  allAirlineAdmins,
  allAeropayeAdmins,
  getAirlineById,
  verifyEmailToken,
  getAirlineFlights,
  getBookedFlight,
  balance,
  airlineClaims,
  cancelAndCheckInCount,
  airlineBankDetails,
  getAllCancellations,
  getCancellationsByFlight,
  totalAmountRefundedByAirline,
  airlinesRefund
};       

    