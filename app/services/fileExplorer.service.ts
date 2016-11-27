//If path is subPaht of another one app should not allow to add it and say it's subPath of another one
import { Injectable } from '@angular/core';
import application = require("application");

import { Observable as RxObservable } from 'rxjs/Observable';
var imageSource = require("image-source")

declare var android:any;

declare var org:any;
declare var android:any;
declare var java:any;

export class FileExplorer{
    public defaultImage = imageSource.fromResource("logo");    
    //defaults
    private defaultExtensions:string[]=[
        'mkv','mp4'
    ]

    private defaultIncludedPaths:string[]=[
        '/habib/folder1',
        '/habib/folder1/folder2',
        '/habib/folder2/folder3'
    ]

    private defaultExcludedPaths:string[]=[
       '/habib/folder1/shouldExclude' 
    ]

    //user
    private extensions:string[]=[
    ]

    private includedPaths:string[]=[
    ]

    private excludedPaths:string[]=[
    ]


    public refresh(){
        
    }

    constructor(){
        this.extensions = this.defaultExtensions.slice();
        this.includedPaths = this.defaultIncludedPaths.slice();
        this.excludedPaths = this.defaultExcludedPaths.slice();

        //getFrom database


    }
    public includePath(path){
        if(this.includedPaths.indexOf(path.trim()) < 0)
            this.includedPaths.push(path);
        //database
    }
    public exludePath(path){
        if(this.excludedPaths.indexOf(path.trim()) < 0)
            this.excludedPaths.push(path);
        
        //database
    }

    public addExtension(extension:string){
         if(this.extensions.indexOf(extension.toLowerCase().trim()) < 0)
            this.excludedPaths.push(extension.toLowerCase().trim());

        //database
    }
    

    
    public explore(){
        
        
        // let paths:string[]=new Array<string>();
        let paths = [];
        let MediaStore =  android.provider.MediaStore;
        let Uri = android.net.Uri;
        let Cursor = android.content.Context;
        
        let uri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
        let projection = [MediaStore.Video.VideoColumns.DATA];
        let c = application.android.context.getContentResolver().query(uri, projection, null,null , null);

        return RxObservable.create(subscriber => {
        
            if (c != null) {
                let temp;
                while (temp = c.moveToNext()) {
                    let path:string = c.getString(0); // give path
                    let image = this.getThumbnail(path);
                    paths.push({'path' : path,'image':image});
                    subscriber.next(paths);
                }
                c.close();
            }

        });

    }

    public getThumbnail(path) {
        let bitmap = android.graphics.Bitmap
        let Media = org.videolan.libvlc.Media
        let VLCUtil = org.videolan.libvlc.util.VLCUtil;
        let LibVLC = org.videolan.libvlc.LibVLC;

        let libVlc = new LibVLC(org.videolan.vlc.util.VLCOptions.getLibOptions(application.android.currentContext));

        let mMedia = new Media(libVlc, path);
        mMedia.parse();

        let image = null;
        image = bitmap.createBitmap(160, 110, bitmap.Config.ARGB_8888);


        let b: number[] = VLCUtil.getThumbnail(mMedia, 160, 110);
        if (b == null) // We were not able to create a thumbnail for this item.
            return this.defaultImage;

        image.copyPixelsFromBuffer(java.nio.ByteBuffer.wrap(b));
        let img = imageSource.fromNativeSource(image); 
        // image = this.cropBorders(image, 160, 110);

        console.log('image' ,img);
        return img;
    }

    public cropBorders( bitmap:any,  width:number,  height:number)
    {

        let Bitmap = android.graphics.Bitmap
        let top:number = 0;
        for (let i = 0; i < height / 2; i++) {
            let pixel1 = bitmap.getPixel(width / 2, i);
            let pixel2 = bitmap.getPixel(width / 2, height - i - 1);
            if ((pixel1 == 0 || pixel1 == -16777216) &&
                (pixel2 == 0 || pixel2 == -16777216)) {
                top = i;
            } else {
                break;
            }
        }

        let left = 0;
        for (let i = 0; i < width / 2; i++) {
            let pixel1 = bitmap.getPixel(i, height / 2);
            let pixel2 = bitmap.getPixel(width - i - 1, height / 2);
            if ((pixel1 == 0 || pixel1 == -16777216) &&
                (pixel2 == 0 || pixel2 == -16777216)) {
                left = i;
            } else {
                break;
            }
        }

        if (left >= width / 2 - 10 || top >= height / 2 - 10)
            return bitmap;

        // Cut off the transparency on the borders
        return Bitmap.createBitmap(bitmap, left, top,
                (width - (2 * left)), (height - (2 * top)));
    }
}