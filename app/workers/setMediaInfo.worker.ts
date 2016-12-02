require("globals");
console.log('before globals');
var imageSource = require("image-source");
let mediaInfoGenerator  = require('../utils/mediaInfoGenerator');
console.log('after globals');




global.onmessage = (msg) => {
    // console.log('before initiate thumbnailGenerator');
    // console.log('after initiate thumbnailGenerator');
    console.log('in worker: ',msg.data);
    let path = msg.data;
    let image = mediaInfoGenerator.setMediaInfo(path);
    // console.log('in Worker');
    // console.dump(image);
    // var img = imageSource.fromNativeSource('logo');
    // var img = imageSource.fromResource("logo");
    global.postMessage(path);
};

global.onerror =  (e)=>{
    console.log('error',e);
}