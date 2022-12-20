const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
const { config } = require("dotenv");
config();


const amqp = require('amqplib/callback_api');
const CONN_URL = process.env.RABBITMQ_URL;


  amqp.connect(CONN_URL, function (err, conn) {
    conn.createChannel(function (err, ch) {
        ch.consume('checkIn', function (msg) {
                console.log('.. Flight worker ...');
                setTimeout(() => {
                    // console.log("Message:", JSON.parse(msg.content));
                    updateFlight(msg.content);
                    ch.ack(msg);
                },4000);
            },{ noAck: false }
        );
    });
  })


  const updateFlight = async(flight) => {
    const data = JSON.parse(flight);
    // const newFlight = await prisma.booked.create({data: { ...data}});
    const flightUpdate = await prisma.booked.update({
        where: {
            ticketId: data.ticketId
        },
        data: {
            checkedIn: data.checkedIn
        },
      }); 
    
    }