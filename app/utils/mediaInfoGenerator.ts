var imageSource = require("image-source");
var application = require("application");
var fs = require("file-system");
var database = require('./media.database');
var utilsAd = require("utils/utils").ad;

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
var context = utilsAd.getApplicationContext();
var libVLC = new LibVLC(context);


function setMediaInfo(path:string) {

    if (!database.isDatabaseReady()) {
        database.initDataBase();
    }

    var mMedia = new Media(libVLC, path);
    mMedia.parse();

    var thumbnail = getThumbnail(mMedia, path);
    var title = getTitle(path);
    var length = mMedia.getDuration();

    database.insertMediaInfo(path, title, length, 0, null, thumbnail);
    return {PATH:path, TITLE: title , LENGTH: length ,POSITION: 0 , SUBLOCATION: null , THUMBNAIL: thumbnail };  
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
    var savingPath:string = fs.path.join(folder.path, encodedString);
    var saved = img.saveToFile(savingPath,'png');
    if(saved)
        return savingPath;
    return null;
}

function getTitle(path:string) {
    var file = fs.File.fromPath(path);
    return file.name;
}

module.exports = {
    'setMediaInfo': setMediaInfo
}