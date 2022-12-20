const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
const { config } = require("dotenv");
config();


const amqp = require('amqplib/callback_api');
const CONN_URL = process.env.RABBITMQ_URL;


  amqp.connect(CONN_URL, function (err, conn) {
    conn.createChannel(function (err, ch) {
        ch.consume('cancellationList', function (msg) {
                console.log('.. Flight worker ...');
                setTimeout(() => {
                    // console.log("Message:", JSON.parse(msg.content));
                    cancellationList(msg.content);
                    ch.ack(msg);
                },4000);
            },{ noAck: false }
        );
    });
  })


  const cancellationList = async(flight) => {
    const data = JSON.parse(flight);
    const newCancel = await prisma.passengercancel.create({data: { ...data}});
    console.log("new-passenger-cancelled", newCancel);
  }