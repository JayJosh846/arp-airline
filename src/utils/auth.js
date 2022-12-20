const jwt = require("jsonwebtoken");
const { config } = require("dotenv");

config();
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXTERNAL_SECRET =
  process.env.ACCESS_TOKEN_EXTERNAL_SECRET;
const getTokenPayload = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const getUserId = (req, authToken) => {
  if (req) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (!token) {
        throw new Error("No token found");
      }
      const { airlineId } = getTokenPayload(token);
      return airlineId;
    }
  } else if (authToken) {
    const { airlineId } = getTokenPayload(authToken);
    return airlineId;
  }

  throw new Error("Not authenticated");
};

module.exports = {
  JWT_SECRET,
  ACCESS_TOKEN_EXTERNAL_SECRET,
  getUserId,
};
