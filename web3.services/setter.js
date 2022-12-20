const Axios = require("axios");
const { config } = require("dotenv");


config();
const baseURL = process.env.WEB3_BASE_URL;

// const web3Client = Axios.create({
//   baseURL,
// });

console.log("base-url", baseURL)

exports.createAccount = async () => {
  let resp;
  await Axios.post(`${baseURL}/aeropaye/operations/create-account`)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-create-account", error.message);
    });
  return resp;
};

exports.addAirline = async (airlineAddress ) => {

  const data = {
    airlineAddress
  }
  let resp;

  await Axios.post(`${baseURL}/aeropaye/operations/add-airline`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-addAirline", error.message);
    });
  return resp;
};


exports.setRefunds = async (airlineAddress, cancelled, delayed, booked, airlinePswd) => {

  const data = {
    airlineAddress,
    cancelled,
    delayed,
    booked,
    airlinePswd
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/operations/set-refunds`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-setRefunds", error.message);
    });
  return resp;
};



exports.escrowCreation = async (airline, airlinePswd, flightCode, flightDeparture, flightArrival, flightTime ) => {

  const data = {
    airline,
    airlinePswd,
    flightCode,
    flightDeparture,
    flightArrival,
    flightTime
  }
  let resp;

  await Axios.post(`${baseURL}/aeropaye/create-escrow`, data)

  .then((result) => {
    resp = result.data
    // console.log(resp)
  })

  .catch((error) => {
    // resp = error.response.data;
    console.log("web3-escrow-creation", error);
  })
 
     
  return resp;
};

exports.addUserList = async ( address ) => {

  const data = {
     address
  }
  let resp;

  await Axios.post(`${baseURL}/aeropaye/operations/add-user-list`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-add-user-list", error.message);
    });
  return resp;
};

// exports.getEscrows = async (airline) => {

//   const data = {
//     airline
//   }
  
//   let resp;

//   await Axios.get(`${baseURL}/aeropaye/airline-escrows/?${airline}`)

//     .then((result) => {
//       resp = result.data
//       return resp;

//     })
//     .catch((error) => {
//       // resp = error.response.data;
//       console.log("web3-getEscrows", error.message);
//     });
// };


exports.airlineClaimBookingFee = async (flightEscrow, escrowKey, airline, airlinePswd) => {

  const data = {
    flightEscrow,
    escrowKey,
    airline,
    airlinePswd
  }

let resp;

  await Axios.post(`${baseURL}/aeropaye/airline-claim-fee`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-airline-claim-booking-fee", error);
    });
  return resp;
};


exports.updateFlightStatus = async (flightEscrow, escrowKey, flightStatus, airline, airlinePswd) => {

  const data = {
    flightEscrow,
    escrowKey,
    flightStatus,
    airline,
    airlinePswd
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/update-flight-status`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-update-flight-status", error);
    });
  return resp;
};


exports.airlineClaimFlightFee = async (flightEscrow, escrowKey, airline, airlinePswd) => {

  const data = {
    flightEscrow,
    escrowKey,
    airline,
    airlinePswd
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/airline-claim-flight-fee`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-airline-claim-flight-fee", error);
    });
  return resp;
};

exports.balanceOf = async (address) => {


  let resp;

  await Axios.get(`${baseURL}/aeropaye/balance/${address}`)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-balanceOf", error);
    });
  return resp;
};

exports.airlineEscrow = async (airline) => {
  let resp;

  await Axios.get(`${baseURL}/aeropaye/airline-escrows/${airline}`)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-airlineEscrow", error);
    });
  return resp;
};

exports.transfer = async (senderaddr, senderpwsd, recipientaddr, amount) => {

  const data = {
    senderaddr, 
    senderpwsd, 
    recipientaddr,
    amount
  }

  let resp;

  await Axios.post(`${baseURL}/aeropaye/tokens/transfer`, data)
    .then((result) => {
      resp = result.data
    })
    .catch((error) => {
      // resp = error.response.data;
      console.log("web3-transfer", error);
    });
  return resp;
};

// exports.createEscrow = async (airline, flightCode, flightDeparture, flightArrival, flightTime) => {
//   const data = {
//       airline,
//       flightCode,
//       flightDeparture,
//       flightArrival,
//       flightTime,
//   }  	
//   await Axios.request({
//     url: '/create-escrow',
//     method: 'post',
//     baseURL: BASE_URL,
//     data: JSON.stringify(data),
//     headers: {
//       'Content-Type': 'application/json',
//       'cache-control': 'no-cache'
//     }
//   })
//     .then((result) => {
//       termiiResult = result.data
//     })
//     .catch((error) => {
//       // termiiResult = error.response.data;
//       console.log("web3", error);
//     });
//   return termiiResult;
// };