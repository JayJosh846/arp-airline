const amqp = require('amqplib/callback_api');
const { config } = require("dotenv");
config()

const CONN_URL = process.env.RABBITMQ_URL


let ch = null;
amqp.connect(CONN_URL, function (err, conn) {
    conn.createChannel(function (err, channel) {
        ch = channel;
    });
});

exports.publishToQueue = async (queueName, data) => {
  return await ch.sendToQueue(queueName, Buffer.from(data), {persistent: true});
}

process.on('exit', (code) => {
  ch.close();
  console.log(`Closing rabbitmq channel`);
});