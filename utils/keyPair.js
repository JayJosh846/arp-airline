const SecretsManager = require("aws-sdk/clients/secretsmanager");
const { createNewBSCAccount } = require("./index");
const { config } = require("dotenv");
config();
const { redisClient } = require("../config/redis.config");
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()




// let pair = {};
let pairSend = undefined
let redisKey = "";


// Use this code snippet in your app.
// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://aws.amazon.com/developers/getting-started/nodejs/
// Load the AWS SDK
const getMnemonic = async () => {
  // const { SecretsManager } = AWS;
  var region = process.env.AWS_REGION,
    secretName = process.env.AWS_SECRET_NAME,
    secret,
    decodedBinarySecret;
  // Create a Secrets Manager client
  const client = new SecretsManager({
    region: region,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  });

  // In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
  // See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
  // We rethrow the exception by default.
  return await client
    .getSecretValue({ SecretId: secretName })
    .promise()
    .then((data) => {
      // Decrypts secret using the associated KMS key.
      // Depending on whether the secret is a string or binary, one of these fields will be populated.
      if ("SecretString" in data) {
        secret = data.SecretString;
        return secret;
      } else {
        let buff = new Buffer(data.SecretBinary, "base64");
        decodedBinarySecret = buff.toString("ascii");
        return decodedBinarySecret;
      }
    })
    .catch((err) => {

      if (err.code === "DecryptionFailureException")
        // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
        // Deal with the exception here, and/or rethrow at your discretion.
        throw err;
      else if (err.code === "InternalServiceErrorException")
        // An error occurred on the server side.
        // Deal with the exception here, and/or rethrow at your discretion.
        throw err;
      else if (err.code === "InvalidParameterException")
        // You provided an invalid value for a parameter.
        // Deal with the exception here, and/or rethrow at your discretion.
        throw err;
      else if (err.code === "InvalidRequestException")
        // You provided a parameter value that is not valid for the current state of the resource.
        // Deal with the exception here, and/or rethrow at your discretion.
        throw err;
      else if (err.code === "ResourceNotFoundException")
        // We can't find the resource that you asked for.
        // Deal with the exception here, and/or rethrow at your discretion.
        throw err;
    });
};

const setUserKeypair = async (email) => {
  let pair = {};

    // TODO: Rebuild user public and private key after retrieving mnemonic key and return account keypair
    var mnemonic = await getMnemonic();
    mnemonic = JSON.parse(mnemonic);   

    pair = await createNewBSCAccount({
      mnemonicString: mnemonic.toString(),
      userSalt: email,
    });

    return pair;
};


module.exports = {
  setUserKeypair
}