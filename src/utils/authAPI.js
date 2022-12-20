const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const { config } = require('dotenv')
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const getTokenPayload = (token) => {
//   return jwt.verify(token, ACCESS_TOKEN_SECRET);

return bcrypt.compareSync(ACCESS_TOKEN_SECRET, token)
}

const getApiAirlineId = (req, authToken) => {
  if (req) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        throw new Error('No token found');
      }
      const {userId} = getTokenPayload(token);

      return userId;
    }
  } else if (authToken) {
    const { userId } = getTokenPayload(authToken);
    return userId;
  }

  throw new Error('Not authenticated');
}

module.exports = {
ACCESS_TOKEN_SECRET,
getApiAirlineId
};
