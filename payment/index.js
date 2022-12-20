const Axios = require("axios");
const { config } = require("dotenv");
config();
const https = require('https');

const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient(); 

const PAYSTACK_TEST_SEC_KEY = process.env.PAYSTACK_TEST_SEC_KEY;
const PAYMENT_REDIRECT_URL = process.env.PAYMENT_REDIRECT_URL;

const makeFiatDeposit = async (amount, email) => {

    const params = JSON.stringify({
        "email": email,
        "amount": amount,
        "callback_url": PAYMENT_REDIRECT_URL 
    })


    const options = {
        hostname: 'api.paystack.co',
        port: 443, 
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_TEST_SEC_KEY}`,
            'Content-Type': 'application/json'
        }
    }

    return new Promise((resolve) => {
        const req = https.request(options, res => {
            let data = ''
            res.on('data', (chunk) => {
                data += chunk
            });
            res.on('end', () => {
                resolve(JSON.parse(data));
            })
        }).on('error', error => {
            console.error(error)
        })

        req.write(params)
        req.end()

    });


}

const verifyDepositedFunds = async (reference) => {

    const options = {
        // hostname: 'api.paystack.co',
        port: 443,
        // path: `/transaction/verify/${reference}`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_TEST_SEC_KEY}`,
        }
    };

    let resp;


    await Axios.get(`https://api.paystack.co/transaction/verify/${reference}`, options)
        .then((result) => {
            resp = result.data

            // console.log (resp);
        })
        .catch((error) => {
            // resp = error.response.data;
            console.log("verify-deposited-fund", error.message);
        });
    return resp;
};

const bankList = async () => {

    const options = {
        port: 443,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_TEST_SEC_KEY}`
        }
    };

    let resp;
    let bankMapName


    await Axios.get('https://api.paystack.co/bank?currency=NGN', options)
        .then(async (result) => {
            resp = result.data

            bankMapName = resp.data.map(a => a);

        })
        .catch((error) => {
            // resp = error.response.data;
            console.log("bank-list", error.message);
        });
    return bankMapName;

}


const verifyAccountNumber = async (accountNumber, bank) => {

    const options = {
        port: 443,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_TEST_SEC_KEY}`
        }
    };

    let resp;

    // retrive all the bank lists along with their codes from the bankList function
    const res = await bankList();

    // loop through the banks to get the exact bank of user and get the bank code

    for (let i = 0; i < res.length; i++) {

        if (bank == res[i].name) {

            //carry out the verification and return the status of the account
            await Axios.get(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${res[i].code}`, options)
                .then((result) => {
                    resp = result.data
                })
                .catch((error) => {
                    resp = error.response.data;
                    console.log("bank-list", error.message);
                });
        }
    }
    

    return resp;
}


const transferRecipientCreation = async (userName, accountNumber, bank) => {

    const res = await bankList();


    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/transferrecipient',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_TEST_SEC_KEY}`,
            'Content-Type': 'application/json'
        }
    }

    for (let i = 0; i < res.length; i++) {

        if (bank == res[i].name) {

            const params = JSON.stringify({
                "type": "nuban",
                "name": userName,
                "account_number": accountNumber,
                "bank_code": res[i].code,
                "currency": "NGN"
            })

            return new Promise((resolve) => {
            const req = https.request(options, res => {
                let data = ''
                res.on('data', (chunk) => {
                    data += chunk
                });
                res.on('end', () => {
                    // console.log(JSON.parse(data))
                    resolve(JSON.parse(data));
                })
            }).on('error', error => {
                console.error(error)
            })

            req.write(params)
            req.end()

            });
        }
    }


}

const initiateTransfer = async (amount,recipient_code) => {

    const params = JSON.stringify({
        "source": "balance", 
        "amount":amount, 
        "recipient": recipient_code
      })

      const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/transfer',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_TEST_SEC_KEY}`,
          'Content-Type': 'application/json'
        }
      }
   
            return new Promise((resolve) => {
            const req = https.request(options, res => {
                let data = ''
                res.on('data', (chunk) => {
                    data += chunk
                });
                res.on('end', () => {
                    // console.log(JSON.parse(data))
                    resolve(JSON.parse(data));
                })
            }).on('error', error => {
                console.error(error)
            })

            req.write(params)
            req.end()

        })
}




module.exports = {
    makeFiatDeposit,
    verifyDepositedFunds,
    verifyAccountNumber,
    transferRecipientCreation,
    initiateTransfer,
}