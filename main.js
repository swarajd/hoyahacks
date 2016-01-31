/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

/*
A simple node.js application intended to blink the onboard LED on the Intel based development boards such as the Intel(R) Galileo and Edison with Arduino breakout board.

MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

Steps for installing MRAA & UPM Library on Intel IoT Platform with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade

Article: https://software.intel.com/en-us/html5/articles/intel-xdk-iot-edition-nodejs-templates
*/

var mraa = require('mraa'); //require mraa
var http = require('http');
var socket = require('socket.io-client')('http://1f68bb46.ngrok.io/');
var sleep = require('sleep');

console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console

var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output
var ledState = false; //Boolean to hold the state of Led
myOnboardLed.write(0);


var arduinoID = 19284819;
var phoneID = null;
var validPhones = [];

//http://www.google.com/index.html
http.get('http://1f68bb46.ngrok.io/', function (res) {
  console.log('Got response:', res.statusCode);
  // consume response body
  res.resume();
}).on('error', function (e) {
  console.log('Got error: ', e.message);
});

socket.on('connect', function() {
    console.log('connected!');
});

socket.on('registerarduino', function(data) {
    console.log('someone tried to register');
    console.log(data); 
    if (phoneID == null) {
        phoneID = data.phoneid;
    }
});

//var myOnboardLed = new mraa.Gpio(3, false, true); //LED hooked up to digital pin (or built in pin on Galileo Gen1)
var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output

socket.on('unlockhouse', function(data) {
    console.log('someone tried to unlock the house');
    console.log(data);
    if (data.arduinoid == arduinoID) {
        console.log('this is the correct arduino');
        var correctPhone = false;
        
        console.log(data.phoneid);
        console.log(phoneID);
        console.log(validPhones);
        if (phoneID == data.phoneid) {
            correctPhone = true;
        } else if (validPhones.indexOf(data.phoneid) != -1) {
            correctPhone = true;
        } else {
            correctPhone = false;
        }
        
        if (correctPhone) {
            console.log('this phone is valid');
            myOnboardLed.write(correctPhone?1:0);
            sleep.sleep(2);
            myOnboardLed.write(0);
        } else {
            console.log('this phone is not valid');
        }
        
    } else {
        console.log('this is not the correct arduino');
    }
});

socket.on('addphone', function(data) {
    console.log(data);
    if (arduinoID == data.arduinoid) {
        validPhones.push(data.phoneid);
    } else {
        return;
    }
});

//var myOnboardLed = new mraa.Gpio(3, false, true); //LED hooked up to digital pin (or built in pin on Galileo Gen1)
var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output
var ledState = true; //Boolean to hold the state of Led

//periodicActivity(); //call the periodicActivity function

function periodicActivity()
{
  myOnboardLed.write(ledState?1:0); //if ledState is true then write a '1' (high) otherwise write a '0' (low)
  ledState = !ledState; //invert the ledState
  setTimeout(periodicActivity,1000); //call the indicated function after 1 second (1000 milliseconds)
}
