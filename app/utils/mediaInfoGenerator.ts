var imageSource = require("image-source");
var application = require("application");
var fs = require("file-system");
var database = require('./media.database');

declare var org:any;
declare var android:any;
declare var Media:any;
declare var VLCUtil:any;
declare var LibVLC:any;
declare var MediaPlayer:any;
declare var java:any;



var bitmap = android.graphics.Bitmap
var Media = org.videolan.libvlc.Media
var VLCUtil = org.videolan.libvlc.util.VLCUtil;
var LibVLC = org.videolan.libvlc.LibVLC;
var MediaPlayer = org.videolan.libvlc.MediaPlayer;



function setMediaInfo(path:string) {

    if (!database.isDatabaseReady()) {
        console.log('init in setMediaInfo');
        database.initDataBase();
    }

    var libVLC = new LibVLC();
    var mMedia = new Media(libVLC, path);
    mMedia.parse();

    var thumbnail = getThumbnail(mMedia, path);
    console.log('thumbnail');
    console.log(thumbnail);
    var title = getTitle(path);
    var length = mMedia.getDuration();

    database.insertMediaInfo(path, title, length, null, null, thumbnail);
}

function getThumbnail(mMedia:any, path:string) {
    var image = null;
    image = bitmap.createBitmap(160, 110, bitmap.Config.ARGB_8888);
    var b = VLCUtil.getThumbnail(mMedia, 160, 110);
    if (b == null) { // We were not able to create a thumbnail for this item.
        return null;
    }

    image.copyPixelsFromBuffer(java.nio.ByteBuffer.wrap(b));

    var img = imageSource.fromNativeSource(image);
    var folder = fs.knownFolders.documents();
    var javaString = new java.lang.String(path);
    var encodedString = android.util.Base64.encodeToString(javaString.getBytes(), android.util.Base64.URL_SAFE | android.util.Base64.NO_WRAP);
    console.log('encodedString', encodedString)
    var savingPath:string = fs.path.join(folder.path, encodedString);
    var saved = img.saveToFile(savingPath,'png');
    console.log('saved');
    console.log(saved);
    return savingPath;
}

function getTitle(path:string) {
    var file = fs.File.fromPath(path);
    console.log('name');
    console.log(file.name);
    return file.name;
}

module.exports = {
    'setMediaInfo': setMediaInfo
}