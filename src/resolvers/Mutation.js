const { config } = require("dotenv");
config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, ACCESS_TOKEN_EXTERNAL_SECRET, getUserId } = require("../utils/auth");
const { sendOTP, verifyOTP } = require("../../termii.token/termii.token");
const { validateId, getAirlineById } = require("../utils/utils");
const cache = require("../../cache.redis/cache");
const { createAccount, addUserList, addAirline, escrowCreation, getEscrows, transfer, airlineClaimBookingFee, 
  updateFlightStatus, airlineClaimFlightFee, setRefunds, balanceOf, airlineEscrow } = require('../../web3.services/setter');
const { publishToQueue } = require("../../message.queue/queue");
const { isEmailOrMobileExist } = require("../utils/utils");
const { getBookingDetails } = require("../../Bookings/user-bookings");
const { redisClient } = require("../../config/redis.config");
const { setUserKeypair } = require("../../utils/keyPair")
const { UserInputError, ValidationError, AuthenticationError, ForbiddenError } = require("apollo-server");

const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;



// global string generator for flight codes
let flightCodeGenerator = Math.random().toString(36).substring(5, 9).toUpperCase();
let ticker = "";

// global.result;


const generateAPI = async (value) => {
  return await bcrypt.hash(value, 10);

};


async function airlineSignup(parent, args, context, info) {
  const isUniqueAirline = await isEmailOrMobileExist(args, context);


  const unique = await context.prisma.airline.findMany()

  let result = unique.map(a => a.email);
  const found = result.find(element => element === args.email);

  if (args.email === found) {
    throw new UserInputError('Email or mobile already exists');
  } 
 
  let resultMobile = unique.map(a => a.mobile);
  const foundMobile = resultMobile.find(element => element === args.mobile);

  if (args.mobile === foundMobile) {
    throw new UserInputError('Email or mobile already exists');
  }

  // if (isUniqueAirline) {
  //   throw new UserInputError('Email or mobile already exists');
  // }

  const termiResponse = await sendOTP(args.mobile);
  const { pinId, smsStatus, to } = termiResponse;

  console.log("pinId, smsStatus, to", pinId, smsStatus, to);

  const cached = await cache.setCacheWithExpiration(
    args.mobile,
    1440,
    JSON.stringify(termiResponse)
  );
  if (cached === "OK") {
    // Create user blockchain account with mnemonic from keypair and email as salt
    const password = await bcrypt.hash(args.password, 10);
    const pair = await setUserKeypair(args.email);
    const airline = await context.prisma.airline.create({
      data: { ...args, password, addr: pair.address },
    });

    const addToList = await addUserList(pair.address);

    console.log("addUserList", addToList);


    const addedAirline = await addAirline(pair.address);
    console.log("add airline", addedAirline);

    const token = jwt.sign({ airlineId: airline.id }, JWT_SECRET);

    return { 
      token,
      airline,
      smsTokenStatus: smsStatus,
    };
  }

  // const password = await bcrypt.hash(args.password, 10);
  // const user = await context.prisma.user.create({
  //   data: { ...args, password },
  // });
  // const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  // return {
  //   token,
  //   airline,
  //   smsTokenStatus: smsStatus,
  // };

}





async function airlineLogin(parent, args, context, info) {
  const airline = await context.prisma.airline.findUnique({
    where: { email: args.email },
  });
  if (!airline) {
    throw new AuthenticationError("No such airline found");
  }
  const valid = await bcrypt.compare(args.password, airline.password);
  if (!valid) {
    throw new AuthenticationError("Invalid password");
  }

  const token = jwt.sign({ airlineId: airline.id }, JWT_SECRET);
  return {
    token,
    airline,
  };
}

async function sendEmailOTP(parent, args, context, info) {
  const password = await bcrypt.hash(args.password, 10);
  const airline = await context.prisma.airline.create({
    data: { ...args, password },
  });
  const token = jwt.sign({ airlineId: airline.id }, JWT_SECRET);
  return {
    token,
    airline,
  };
}

async function verifyMobileWithTermiiToken(parent, args, context, info) {
  const result = await cache.getCachedItem(args.msisdn);
  if (!result) {

    throw new AuthenticationError("Invalid number");
  }
  const { pinId } = JSON.parse(result);
  const termiResponse = await verifyOTP(pinId, args.pin);
  if (
    termiResponse.verified === false ||
    termiResponse.verified === "Expired" ||
    termiResponse.status == 400
  ) {
    // return {
    //   msisdn: termiResponse.msisdn,
    //   verified: termiResponse.verified,
    // };
    throw new UserInputError('Invalid code entered', {
      argumentName: 'pin'
    });

  } else if (termiResponse.status == 200 || termiResponse.verified) {
    // const web3Account = await createAccount();
    const hashedApiKey = await generateAPI(ACCESS_TOKEN_EXTERNAL_SECRET);
    console.log("apiKey", hashedApiKey);

    const airline = await context.prisma.airline.update({
      where: {
        mobile: args.msisdn,
      },
      data: {
        // addr: web3Account.data.address,
        // pvtKey: web3Account.data.privateKey,
        mobileVerified: true,
        apiKey: hashedApiKey
      },
    })

    if (airline) {

      // const addedAirline = await addAirline(web3Account.data.address);
      // console.log(addedAirline);
    }
        // send created airline to admin with rabbitmq
    const msgResult = await publishToQueue("createdAirline", JSON.stringify(airline));

    return {
      msisdn: termiResponse.msisdn,
      verified: termiResponse.verified,
    }
  }
}

async function sendTermiiTokenToMobile(parent, args, context, info) {
  const { pinId, smsStatus, to } = await sendOTP(args.msisdn);
  return {
    msisdn: to,
    pinId,
    status: smsStatus,
  };
}

const airlineSetRefunds = async (parent, args, context, info) => {

  const airlineDetails = await getAirlineById(context);
  const pair = await setUserKeypair(airlineDetails.email);

  console.log("address", pair)
  console.log("private key", pair.privateKey);

  const refundsSet = await setRefunds(pair.address, args.cancelled, args.delayed, args.booked, pair.privateKey);
  console.log("set refunds", refundsSet);

  if (refundsSet.status !== "success") { 
    throw new ValidationError("Unable to set refunds.");
  }

  return {
    status: refundsSet.status,
    data: refundsSet.data
  }
}



const registerFlight = async (parent, args, context, info) => {
  const airlineDetails = await getAirlineById(context);
  // console.log(flightCodeResult); 
  let flightCodeGenerator;

    // Get Keypair
    const pair = await setUserKeypair(airlineDetails.email);

    console.log("pair", pair.address);
    console.log("pair privatekey", pair.privateKey);

  if (airlineDetails.airlineName == "Azman Air") {
    flightCodeGenerator = Math.random().toString(36).substring(5, 9).toUpperCase();
    ticker = "AZM " + flightCodeGenerator;
  } else if (airlineDetails.airlineName == "Air Peace") {
    flightCodeGenerator = Math.random().toString(36).substring(5, 9).toUpperCase();
    ticker = "ARP " + flightCodeGenerator;
  } else if (airlineDetails.airlineName == "Arik Air") {
    flightCodeGenerator = Math.random().toString(36).substring(5, 9).toUpperCase();
    ticker = "ARK " + flightCodeGenerator;
  }



  const escrow = await escrowCreation(pair.address, pair.privateKey,
    ticker, args.departureDate, args.arrivalDate, args.departureTime);

 
  // added registered flight to db
  const flightDetails = {
    flightCode: ticker,
    airlineId: airlineDetails.id,
    airlineName: airlineDetails.airlineName,
    airlineAddres: pair.address,
    ...args,
    flightEscrow: escrow.data.flightEscrow
  };

  const flight = await context.prisma.flight.create({
    data: { ...flightDetails },
  });

  const flightEscrowIndex = flightDetails.flightEscrow;

  // await redisClient.rpush([airlineDetails.airlineName, result], function(err, reply) {
  //   console.log(airlineDetails.airlineName + "...", reply); 
  // });


  // Send registered flight to users with rabitmq
  const msgResult = await publishToQueue("registerFlight", JSON.stringify(flight));
  return {
    flight
  };
}




const airlineClaimsBooking = async (parent, args, context, info) => {

  const bookedFlightDetails = await context.prisma.booked.findMany(
    {
      where: {
        flightCode: args.flightCode
      }
    }
  );

  let acct = bookedFlightDetails.map(a => a);

  const bookedFlightDetail = acct.find(({ flightCode }) => flightCode === args.flightCode);


  const airlineDetails = await getAirlineById(context);

  // get the escrows of the flights from airline DB
  const airlineEscrows = await context.prisma.airline.findUnique({
    where: {
      id: airlineDetails.id
    },
    include: {
      flight: {
        select: {
          flightEscrow: true,
        },
      },
    },
  })

  let result = airlineEscrows.flight.map(a => a.flightEscrow); //[1,3,5]
  console.log("escrow array", result);


  let flightesrwIndex = result.indexOf(bookedFlightDetail.flightEscrow);

    // Get Keypair
    const pair = await setUserKeypair(airlineDetails.email);


  const bookingClaimResult =
    await airlineClaimBookingFee(bookedFlightDetail.flightEscrow, flightesrwIndex, pair.address, pair.privateKey);

  console.log("booking claim result", bookingClaimResult);

  // send bookedDetails and status of book claims to user
  const rabitmgMsg = {
    bookedFlightDetail,
    bookingClaimResult
  }

  console.log(rabitmgMsg);

  await publishToQueue("bookedClaims", JSON.stringify(rabitmgMsg));

  // }

  return {
    bookingClaimResult
  }

}

async function flightClaim(parent, args, context, info) {


  const airlineDetails = await getAirlineById(context);
  const pair = await setUserKeypair(airlineDetails.email);



    const bookedFlightDetails = await context.prisma.booked.findMany(
      { 
        where: {
          flightCode: args.flightCode
        }
      }
    );

    let acct = bookedFlightDetails.map(a => a);

    const bookedFlightDetail = acct.find(({ flightCode }) => flightCode === args.flightCode);

    // const airlineEscrows = await context.prisma.airline.findUnique({
    //   where: {
    //     id: airlineDetails.id
    //   },
    //   include: {
    //     flight: {
    //       select: {
    //         flightEscrow: true,
    //       },
    //     },
    //   },
    // })

    // let result = airlineEscrows.flight.map(a => a.flightEscrow); //[1,3,5]
    // console.log("escrow array", result);


    // let flightesrwIndex = result.indexOf(bookedFlightDetail.flightEscrow);


    const {data: {flightEscrow}} = await airlineEscrow(airlineDetails.addr);

    let flightesrwIndex = flightEscrow.indexOf(bookedFlightDetail.flightEscrow);

    const updateFlight = await updateFlightStatus(bookedFlightDetail.flightEscrow, flightesrwIndex,
       3, pair.address, pair.privateKey)

    if (updateFlight.status !== "success") {
      throw new ValidationError("Failed to cancel booking");
    }


    const claims  = await airlineClaimFlightFee(bookedFlightDetail.flightEscrow, flightesrwIndex, 
      pair.address, pair.privateKey);

      console.log("claims", claims)

      // update claims db
      const claimsUpdate = {
        airlineId: airlineDetails.id,
        airlineName: airlineDetails.airlineName,
        status: claims.status,
        flightCode: bookedFlightDetail.flightCode,
        departureCity: bookedFlightDetail.departureCity,
        departureDate: bookedFlightDetail.departureDate,
        arrivalCity: bookedFlightDetail.arrivalCity,
        arrivalDate: bookedFlightDetail.arrivalDate
      }

      await context.prisma.airlineclaim.create({
        data: {
          ...claimsUpdate
        }
      })

          //update booked db    
    const bookUpdate = await context.prisma.booked.updateMany({
      where: {
        flightCode: args.flightCode,
      },
      data: {
        status: 'COMPLETED',
        
      },
    })

    const flightUpdate = await context.prisma.flight.update({
      where: {
        flightCode: args.flightCode
      },
      data: {
        // pass: passengerCount + fqPass,
        // totalFee: totalAmount + fqTotalFee,
        flightComplete: true,
        status: 'COMPLETED'
      }  
    })

    await context.prisma.archivedflight.create ({
      data: {
        ... flightUpdate
      }
    }) 

    const deleteClaimedFlight = await context.prisma.flight.delete({
      where: {
        flightCode: args.flightCode
      }
    })

    await publishToQueue("bookedFlightComplete", JSON.stringify(bookUpdate));

    await publishToQueue("deleteClaimedFlight", JSON.stringify(deleteClaimedFlight));

      return {
        status: "success",
        message: "Claims successful."
      }
      
    

}

async function airlineBankDetails(parent, args, context, info) {


  const airline = await getAirlineById(context);


  const transaction = await context.prisma.airlinesbanklist.findMany({
    where: { airlineId: airline.id }
  }) 

  if (transaction.length === 0) {
    const airlineDetails = {
      airlineId: airline.id,
      acctResCountry: args.residentCountry,
      acctName: args.acctName,
      acctBank: args.acctBank,
      acctNumber: args.acctNumber, 
      acctType: args.acctType,
      acctSwiftCode: args.acctSwiftCode
    }


    await context.prisma.airlinesbanklist.create({
      data: { ...airlineDetails },
    });

    return {
      
      message: "Airline details successfully updated"
    };
  }

  else {


    let result = transaction.map(a => a.acctNumber);


    const found = result.find(element => element == args.acctNumber);

    if (args.acctNumber == found) {

      throw new UserInputError('Account already exists');

    } else {

      const airlineDetails = {
        airlineId: airline.id,
        acctResCountry: args.residentCountry,
        acctName: args.acctName,
        acctBank: args.acctBank,
        acctNumber: args.acctNumber,
        acctType: args.acctType,
        acctSwiftCode: args.acctSwiftCode
      }
  
  
      await context.prisma.airlinesbanklist.create({
        data: { ...airlineDetails },
      });
  
      return {
        status: "success",
        message: "Airline details successfully updated"
      };
    }

  }

}

async function redeemFiat(parent, args, context, info) {

  const tx_ref = uuid();

  const airline = await getAirlineById(context);

  const airlineBank = await context.prisma.airline.findUnique({
    where: {
      id: airline.id
    },
    include: {
      airlineBankList: true,
    },
  })

  // map through and find account numbers
  let acct = airlineBank.airlineBankList.map(a => a);

  const acctFound = acct.find(({ acctNumber }) => acctNumber === args.accountToWithdraw);


  if (acctFound && args.accountToWithdraw == acctFound.acctNumber) {

    // verify users account
    const { status, data } = await verifyAccountNumber(acctFound.acctNumber, acctFound.acctBank);

    if (status == true) {

      const { status, data: { active, recipient_code } } =

        await transferRecipientCreation(data.account_name, data.account_number, acctFound.acctBank);

      if (status == true && active == true) {
        // check to ensure user doesn't input more than the amount in the balance

        const userBalance = await balanceOf(airline.addr);

        if (parseInt(args.amount) > parseInt(userBalance.data)) {
          throw new UserInputError('You cannot withdraw an amount greater than your balance.');
        }
        const newAmountx = args.amount * 100;

        // transfer funds to users bank account
        const { status, data: { amount } } = await initiateTransfer(newAmountx, recipient_code)

        if (status !== true) {
          throw new ValidationError("Failed to complete transaction. Please try again.");
        }

        // transfer users tokens to Admin wallet

        const result = await transfer(
          airline.addr,
          airline.pvtKey,
          ADMIN_ADDRESS,
          args.amount)
        console.log(result);

        if (result.status !== "success") {

          throw new ValidationError("Failed to deduct user balance.");
        }

        const newWalletTrans = {
          airlineId: airline.id,
          from: airline.email,
          fromAddr: airline.addr,
          receiverAddr: ADMIN_ADDRESS,
          amount: parseInt(args.amount),
          description: "Withdrawal to bank account",
          trxRef: tx_ref,
          trxType: "Withdrawal",
          status: "Completed"
        }

        await context.prisma.wallettransactions.create({
          data: { ...newWalletTrans },
        });

        const balanceWallet = await balanceOf(airline.addr)
        // update user table

        await context.prisma.airline.update({
          where: {
            id: airline.id
          },
          data: {
            walletBalance: balanceWallet.data,
          }
        })

        return {
          status: "success",
          message: "Withdrawal operation complete."
        }

      }

      else {
        throw new ValidationError("Failed to create recipient. Please try again.");

      }

    } else {

      throw new ValidationError("Account Verification failed. Please check that the account is valid and try again.");

    }

  }
  else {
    throw new UserInputError('Account does not exist');
  }


}

async function setRefundPolicy(parent, args, context, info) {
  const airlineDetails = await getAirlineById(context);

    const refundDetails = {
      airlineId: airlineDetails.id,
      airlineName: airlineDetails.airlineName,
      num: args.num,
      scheduled: args.scheduled,
      parcentage: args.parcentage,
    }


    await context.prisma.airlinerefunds.create({
      data: { ...refundDetails },
    });
    
    await publishToQueue("setRefunds", JSON.stringify(refundDetails));


    return {
      status: "success",
      message: "Refund policy successfully set"
    };

}


// async function transferToken(parent, args, context, info) {


//   const tx_ref = uuid();

//   const user = await getAUserById(context);

//   // check to ensure user doesn't input more than the amount in the balance

//   const userBalance = await balanceOf(user.addr);

//   if (parseInt(args.amount) > parseInt(userBalance.data)) {
//     throw new UserInputError('You cannot transfer an amount greater than your balance.');
//   }

//   // commense transfer process
//   const result = await transfer(
//     user.addr,
//     user.pvtKey,
//     args.recipientAddress,
//     args.amount
//   );

//   if (result.status !== "success") {

//     throw new ValidationError("Failed to transfer tokens.");
//   }

//   const newWalletTrans = {
//     userId: user.id,
//     from: user.email,
//     fromAddr: user.addr,
//     receiverAddr: args.recipientAddress,
//     amount: parseInt(args.amount),
//     description: "Sent Token",
//     trxRef: tx_ref,
//     trxType: "Send",
//     status: "Completed"
//   }

//   await context.prisma.wallettransactions.create({
//     data: { ...newWalletTrans },
//   });

//   const balanceWallet = await balanceOf(user.addr)

//   // update user table

//   await context.prisma.user.update({
//     where: {
//       id: user.id
//     },
//     data: {
//       walletBalance: balanceWallet.data,
//     }
//   })

//   return {
//     status: "success",
//     message: "Transfer operation complete."
//   }

// }




module.exports = {
  airlineSignup,
  airlineLogin,
  sendEmailOTP,
  verifyMobileWithTermiiToken,
  sendTermiiTokenToMobile,
  airlineSetRefunds,
  setRefundPolicy,
  registerFlight,
  airlineClaimsBooking,
  flightClaim,
  airlineBankDetails
  // airlineClaimBookingFee, 
  // updateFlightStatus, 
  // airlineClaimFlightFee
};
