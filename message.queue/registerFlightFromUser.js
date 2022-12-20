const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
const { config } = require("dotenv");
config();


const amqp = require('amqplib/callback_api');
const CONN_URL = process.env.RABBITMQ_URL;


  amqp.connect(CONN_URL, function (err, conn) {
    conn.createChannel(function (err, ch) {
        ch.consume('registerFlightFromUser', function (msg) {
                console.log('.. Flight worker ...');
                setTimeout(() => {
                    // console.log("Message:", JSON.parse(msg.content));
                    registerFlightFromUser(msg.content);
                    ch.ack(msg);
                },4000);
            },{ noAck: false }
        );
    });
  })


  const registerFlightFromUser = async(flight) => {
    const data = JSON.parse(flight);
    const newFlight = await prisma.flight.create({data: { ...data}});
    console.log("new-flight-created", newFlight);
  }