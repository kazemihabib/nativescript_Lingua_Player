require("globals");
console.log('before globals');
var imageSource = require("image-source");
let thumbnailGenerator = require('./thumbnailGenerator');
console.log('after globals');




global.onmessage = (msg) => {
    console.log('before initiate thumbnailGenerator');
    console.log('after initiate thumbnailGenerator');
    console.log('in worker: ',msg.data);
    let path = msg.data;
    let image = thumbnailGenerator.getThumbnail(path);
    // var img = imageSource.fromNativeSource('logo');
    // var img = imageSource.fromResource("logo");
    global.postMessage(image);
};

global.onerror =  (e)=>{
    console.log('error',e);
}