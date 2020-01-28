const gpsdFake = require('gpsd-fake');
const fs = require('fs');
const tls = require('tls');
const gpsd = require('node-gpsd');
const mqtt = require('mqtt')
let messageCount = 0;
const publishEvery = process.env.PUBLISH_EVERY;
const mqttUrl = process.env.MQTT_URL;
const mqttUsername = process.env.MQTT_USERNAME;
const mqttPassword = process.env.MQTT_PASSWORD;
const trackerIds = process.env.TRACKER_IDS.split(',');
console.log('publishEvery', publishEvery);
console.log('mqttUrl', mqttUrl);
trackerIds.forEach(function (trackerId, index) {
    console.log('trackerId '+trackerId);
});

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

gpsdFake({
    port: 8085,
    // tmpFile: 'gpsd-fake-last-session.json', // might be relative or absolute
    configFile: 'config.json' // might be relative or absolute
});

let listener = new gpsd.Listener({
    port: 8085,
    hostname: 'localhost',
    logger: {
        info: function () {
        },
        warn: console.warn,
        error: console.error
    },
    parse: true
});

let client = mqtt.connect(mqttUrl, {username: mqttUsername, password: mqttPassword/*, secureContext: context*/});

client.on('reconnect', function () {
    console.log("reconnect");
});

client.on('close', function () {
    console.log("close");
});

client.on('offline', function () {
    console.log("offline");
});

client.on('end', function () {
    console.log("end");
});

client.on('packetsend', function (packet) {
    console.log("packetsend");
});

client.on('packetreceive', function (packet) {
    console.log("packetreceive");
});


client.on('error', function (error) {
    console.log(error)
});

client.on('message', function (topic, message) {
    console.log("message", message.toString());
});

client.on('connect', function () {
    console.log("client connect");
});

listener.connect(function () {
    console.log('listener connect');
});
//gpsd events like described in the gpsd documentation. All gpsd events like: TPV, SKY, INFO and DEVICE can be emitted. To receive all TPV events just add

listener.on('TPV', function (data) {
    //console.log(data);
    //console.log(messageCount);
    let index = messageCount % trackerIds.length;
    //console.log(index);
    let message = {
        Bandwidth: 125000,
        BatteryLevel: 4.07999992370605,
        Calculatedcrc: 50432,
        Codingrate: 7,
        Crcstatus: "Ok",
        Frequency: 868250000,
        Gps: {
            Fix: true,
            Hdop: 2.90000009536743,
            Height: 141.399993896484,
            LastGPSPos: "09/23/2019 13:35:13",
            LastLatitude: data.lat,
            LastLongitude: data.lon,
            Latitude: data.lat,
            Longitude: data.lon,
            Time: "09/23/2019 13:35:15"
        },
        Host: "loranode1",
        Name: trackerIds[index],
        PacketRssi: 0,
        Receivedtime: "09/23/2019 13:35:13",
        Recieverinterface: 6,
        Recieverradio: 1,
        Rssi: -85,
        Snr: 9.75,
        Snrmax: 15.75,
        Snrmin: 7.5,
        Spreadingfactor: 10,
        Time: 2428251756
    };
    if (messageCount % publishEvery === 0) {
        client.publish('lora/data/' + trackerIds[index], JSON.stringify(message));

        if (getRandomInt(100) > 95) {
            client.publish('lora/panic/' + trackerIds[index], JSON.stringify(message));
        }
    }
    messageCount++;
});

listener.on('SKY', function (data) {
    //console.log(data);
});

listener.on('INFO', function (data) {
    //console.log(data);
});

listener.on('DEVICE', function (data) {
    //console.log(data);
});

listener.watch({class: 'WATCH', json: true, nmea: false});