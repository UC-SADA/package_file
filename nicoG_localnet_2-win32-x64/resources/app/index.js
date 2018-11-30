"use strict";
const electron = require('electron');
const elc_app = electron.app;
const elc_BrowserWindow = electron.BrowserWindow;
const path = require('path');
const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const extend = require('util')._extend
const os = require('os');
const interfaces = os.networkInterfaces();
const addresses = Object.keys(interfaces)
  .reduce((results, name) => results.concat(interfaces[name]), [])
  .filter((iface) => iface.family === 'IPv4' && !iface.internal)
  .map((iface) => iface.address);
const mkdirp = require("mkdirp")
const fs = require('fs');

  function getLocalAddress() {
      var ifacesObj = {}
      ifacesObj.ipv4 = [];
      ifacesObj.ipv6 = [];
      var interfaces = os.networkInterfaces();

      for (var dev in interfaces) {
          interfaces[dev].forEach(function(details){
              if (!details.internal){
                  switch(details.family){
                      case "IPv4":
                          ifacesObj.ipv4.push({name:dev, address:details.address})
                      break;
                      case "IPv6":
                          ifacesObj.ipv6.push({name:dev, address:details.address})
                      break;
                  }
              }
          });
      }
      return ifacesObj;
  };


  var getIP = function (req) {
    if (req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for'];
    }
    if (req.connection && req.connection.remoteAddress) {
      return req.connection.remoteAddress;
    }
    if (req.connection.socket && req.connection.socket.remoteAddress) {
      return req.connection.socket.remoteAddress;
    }
    if (req.socket && req.socket.remoteAddress) {
      return req.socket.remoteAddress;
    }
    return '0.0.0.0';
  };


  require('date-utils') //現在時刻の取得に必要

http.listen(2525, function(){
  console.log(addresses + ":2525");
});


//LOG用の変数
var good = 0
var bad =0
var question =0
var setsubun =0
const getDirName = path.dirname

function writeFile (path, contents, cb) {
  mkdirp(getDirName(path), function (err) {
    if (err) return cb(err)
    fs.writeFile(path, contents, cb)
  })
}


//ファイルの追記関数
function appendFile(path, data, cb) {
  mkdirp(getDirName(path), function (err) {
    if (err) return cb(err)
    fs.appendFile(path, data, function (err) {
      if (err) {
          throw err;
      }
    });
  })
}


var mainWindow = null;
var mainWindow2 = null;
elc_app.on('ready', function () {
    var size = electron.screen.getPrimaryDisplay().size;
    mainWindow = new elc_BrowserWindow({
        left: 0,
        top: 0,
        width: 400,
        height: size.height,
        frame: true,
        show: true,
        transparent: false,
        resizable: true,
        webPreferences: {nodeIntegration: false}
    });
//    mainWindow.setIgnoreMouseEvents(true);
//    mainWindow.maximize();
//    mainWindow.setAlwaysOnTop(true);
    mainWindow.loadURL("http://" + addresses + ":2525/controller");
//    mainWindow.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
            });

    mainWindow2 = new elc_BrowserWindow({
        left: 0,
        top: 0,
        width: size.width,
        height: size.height,
        frame: false,
        show: true,
        transparent: true,
        resizable: true,
        webPreferences: {nodeIntegration: false}
    });
    var dt = new Date()
    appendFile("./Log/"+dt.toFormat("YYYYMMDD")+"comment.txt",dt.toFormat("YYYY年MM月DD日HH24時MI分SS秒") + "/Log開始" + JSON.stringify(getLocalAddress()) + "\n");
    appendFile("./Log/"+dt.toFormat("YYYYMMDD")+"like.txt",dt.toFormat("YYYY年MM月DD日HH24時MI分SS秒") + "/Log開始" +"\n");
    mainWindow2.setIgnoreMouseEvents(true);
    mainWindow2.maximize();
    mainWindow2.setAlwaysOnTop(true);
    mainWindow2.loadURL("http://localhost:2525/display");
//    mainWindow2.openDevTools();
    mainWindow2.on('closed', function () {
    mainWindow2 = null;
      });

});

//入力側画面指定
app.use("/controller",express.static(path.join(__dirname, 'public')))

//出力側画面指定
app.get("/display", function(req, res){
  res.sendFile(__dirname + '/index_nico-Display.html');
});

require('console-stamp')(console, '[HH:MM:ss.l]')
/*
app.get('/comment', function (req, res) {
  const msg = extend({}, req.query)
  io.emit('comment', msg);
  res.end()
})

app.get('/like', function (req, res) {
  const msg = extend({}, req.query);
  io.emit('like', msg)
  res.end()
})
*/
app.get('/comment', function (req, res) {
  const msg = extend({}, req.query)
  var dt = new Date()
  console.log('comment: ' + JSON.stringify(msg))
  appendFile("./Log/"+dt.toFormat("YYYYMMDD")+"comment.txt",dt.toFormat("YYYY年MM月DD日HH24時MI分SS秒") + "/IP:" + getIP(req) + "/COMMENT:" + JSON.stringify(msg)+"\n");
  io.emit('comment', msg);
  io.emit('chat', msg.body);
  res.end()
})


app.get('/like', function (req, res) {
  const msg = extend({}, req.query);
  var dt = new Date()
  if ( JSON.stringify(msg).match(/Good/) )
{
    good++;
    console.log("Good : " + good);
    appendFile("./Log/"+dt.toFormat("YYYYMMDD")+"like.txt",dt.toFormat("YYYY年MM月DD日HH24時MI分SS秒") + "/IP:" + getIP(req) + "/Good:" + good + "\n");
}
else
{
    if ( JSON.stringify(msg).match(/Bad/) )
    {
        bad++
        console.log("Bad : " + bad);
        appendFile("./Log/"+dt.toFormat("YYYYMMDD")+"like.txt",dt.toFormat("YYYY年MM月DD日HH24時MI分SS秒") + "/IP:" + getIP(req) + "/Bad:" + bad + "\n");
    }
    else
{
  if ( JSON.stringify(msg).match(/Question/) )
  {
      question++
      console.log("Question : " + question);
      appendFile("./Log/"+dt.toFormat("YYYYMMDD")+"like.txt",dt.toFormat("YYYY年MM月DD日HH24時MI分SS秒") + "/IP:" + getIP(req) + "/Question:" + question + "\n");
  }
  else
{
      setsubun ++
      console.log("Setsubun : " + setsubun);
      appendFile("./Log/"+dt.toFormat("YYYYMMDD")+"like.txt",dt.toFormat("YYYY年MM月DD日HH24時MI分SS秒") + "/IP:" + getIP(req) + "/Setsubun:" + setsubun + "\n");
  }

}
}
  io.emit('like', msg)
  res.end()
})
