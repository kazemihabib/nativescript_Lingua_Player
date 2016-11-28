//If path is subPaht of another one app should not allow to add it and say it's subPath of another one
import { Injectable } from '@angular/core';
import application = require("application");
// import {ThumbnailGenerator} from '../utils/thumbnailGenerator';

import { Observable as RxObservable } from 'rxjs/Observable';
var timer = require("timer");
var imageSource = require("image-source");

declare var android:any;
declare var org:any;


export class FileExplorer{
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

    console.log('currentContext',application.android.currentContext);
    console.log('is null ',org.videolan.vlc.util.VLCOptions.getLibOptions(application.android.currentContext));
    let libOptions = org.videolan.vlc.util.VLCOptions.getLibOptions(application.android.currentContext);

        return RxObservable.create(subscriber => {
            // let thumbnailGenerator = new ThumbnailGenerator();
            let worker = new Worker('../workers/getThumbnail.worker');
            // let generator = new ThumbnailGenerator();

            let file_paths: string[] = [];
            if (c != null) {
                let temp;
                while (temp = c.moveToNext()) {
                    let path:string = c.getString(0); // give path
                    file_paths.push(path);
                    //let image = this.getThumbnail(path);
                    //paths.push({'path' : path,'image':image});
                    //subscriber.next(paths);
                }
                c.close();
            }
            if(file_paths.length) {
                let generate_thumbnail = (inx) => {
                    if(inx == file_paths.length) return ;
                    let path = file_paths[inx];
                    // let image = generator.getThumbnail(path);
                    worker.postMessage(path);

                    worker.onmessage = (msg)=>{
                        let image = msg.data;
                        // console.log('img',image);

                        // let img = imageSource.fromNativeSource('img');
                        var img = imageSource.fromResource("logo");
                        paths.push({'path' : path,'image':img});
                        subscriber.next(paths);
                        // generate_thumbnail(inx + 1);
                        timer.setTimeout(() => generate_thumbnail(inx+1),30);
                    }
                }
                generate_thumbnail(0);
            }
            // subscriber.next(paths);

        });

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