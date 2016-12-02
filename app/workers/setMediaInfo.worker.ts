require("globals");
var imageSource = require("image-source");
let mediaInfoGenerator  = require('../utils/mediaInfoGenerator');


global.onmessage = (msg) => {
    console.log('in worker: ',msg.data);
    let path = msg.data;
    let mediaInfo = mediaInfoGenerator.setMediaInfo(path);
    global.postMessage(mediaInfo);
};

global.onerror =  (e)=>{
    console.log('error',e);
}