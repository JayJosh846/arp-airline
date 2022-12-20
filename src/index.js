const { PrismaClient } = require("@prisma/client");
const { ApolloServer } = require("apollo-server");
const fs = require("fs");
const path = require("path");
const { getUserId } = require("./utils/auth");
const { getApiAirlineId } = require('./utils/authAPI')
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const { config } = require("dotenv");
config();
const express = require('express')
const cors = require('cors');
const { consumeFromQueue } = require("../message.queue/queue");
const { flightWorker } = require('../message.queue/flightWorker');
const { flightUpdate } = require('../message.queue/flightUpdate');
const {checkInUpdate} = require('../message.queue/checkInUpdate');
const {registerFlightFromUser} = require('../message.queue/registerFlightFromUser');
const {checkInCount} = require('../message.queue/checkInCount');
const {cancelUpdate} = require('../message.queue/cancelUpdate');
const {cancelCount} = require('../message.queue/cancelCount');
const {cancellationList} = require('../message.queue/cancellationList');
const {keyPair} = require('../utils/keyPair')
const { Kind, GraphQLScalarType } = require('graphql');


const app = express()
const PORT = process.env.PORT;

const CORS_CONFIG = {
  origin: true,
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};

app.options("*", cors());
app.use(cors(CORS_CONFIG));
app.set("trust proxy", 1);

// app.use(cors({
//   origin: ['http://localhost:3000/', 'localhost:3000', 'https://vercel.com/convexity/aeropaye-landing-page', 
//   'https://vercel.com/convexity/aeropaye-dashboard', 'https://aeropaye-airline.herokuapp.com/',  
//   'https://aeropaye-airline.herokuapp.com', 'https://airline.aeropaye.com/', 'https://airline.aeropaye.com',
//    'http://localhost:4100']

// }))
 // enable `cors` to set HTTP response header: Access-Control-Allow-Origin: *app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }))
// app.listen(PORT)

const prisma = new PrismaClient();


const resolverMap = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value) // value from the client
    },
    serialize(value) {
      return value.getTime() // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(+ast.value) // ast value is always in string format
      }
      return null
    }
  })
}

const resolvers = {
  Query,
  Mutation,
};

const server = new ApolloServer({
  typeDefs: fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
  resolvers,
  resolverMap,
  context: ({ req }) => {
    return {
      ...req,
      prisma,
      // airlineId: req && req.headers.authorization ? getApiAirlineId(req) : null
      airlineId: req && req.headers.authorization ? getUserId(req) : null,

    };
  }, 
});

server.listen(PORT).then(() => console.log(`Server is running on ${PORT}`));
