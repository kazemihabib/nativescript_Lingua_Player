//If path is subPaht of another one app should not allow to add it and say it's subPath of another one
import { Injectable } from '@angular/core';
import application = require("application");
// import {ThumbnailGenerator} from '../utils/thumbnailGenerator';

import { Observable as RxObservable } from 'rxjs/Observable';
var timer = require("timer");
var imageSource = require("image-source");
var database = require('../utils/media.database');

declare var android: any;
declare var org: any;


export class FileExplorer {
    //defaults
    private defaultExtensions: string[] = [
        'mkv', 'mp4'
    ]

    private defaultIncludedPaths: string[] = [
        '/habib/folder1',
        '/habib/folder1/folder2',
        '/habib/folder2/folder3'
    ]

    private defaultExcludedPaths: string[] = [
        '/habib/folder1/shouldExclude'
    ]

    //user
    private extensions: string[] = [
    ]

    private includedPaths: string[] = [
    ]

    private excludedPaths: string[] = [
    ]


    public refresh() {

    }

    constructor() {
        this.extensions = this.defaultExtensions.slice();
        this.includedPaths = this.defaultIncludedPaths.slice();
        this.excludedPaths = this.defaultExcludedPaths.slice();

        //getFrom database

    }
    public includePath(path) {
        if (this.includedPaths.indexOf(path.trim()) < 0)
            this.includedPaths.push(path);
        //database
    }
    public exludePath(path) {
        if (this.excludedPaths.indexOf(path.trim()) < 0)
            this.excludedPaths.push(path);

        //database
    }

    public addExtension(extension: string) {
        if (this.extensions.indexOf(extension.toLowerCase().trim()) < 0)
            this.excludedPaths.push(extension.toLowerCase().trim());

        //database
    }



    public explore() {


        // let paths:string[]=new Array<string>();
        let paths = [];
        let MediaStore = android.provider.MediaStore;
        let Uri = android.net.Uri;
        let Cursor = android.content.Context;

        let uri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
        let projection = [MediaStore.Video.VideoColumns.DATA];
        let c = application.android.context.getContentResolver().query(uri, projection, null, null, null);

        // console.log('currentContext',application.android.currentContext);
        // console.log('is null ',org.videolan.vlc.util.VLCOptions.getLibOptions(application.android.currentContext));
        // let libOptions = org.videolan.vlc.util.VLCOptions.getLibOptions(application.android.currentContext);

        return RxObservable.create(subscriber => {
            // let thumbnailGenerator = new ThumbnailGenerator();
            let worker = new Worker('../workers/setMediaInfo.worker');
            // let generator = new ThumbnailGenerator();

            let file_paths: string[] = [];
            if (c != null) {
                let temp;
                while (temp = c.moveToNext()) {
                    let path: string = c.getString(0); // give path
                    file_paths.push(path);
                    //let image = this.getThumbnail(path);
                    //paths.push({'path' : path,'image':image});
                    //subscriber.next(paths);
                }
                c.close();
            }

            console.log('file_path length', file_paths.length);
            if (file_paths.length) {

                if (!database.isDatabaseReady()) {
                    database.initDataBase();
                }

                let generate_thumbnail = (inx) => {
                    console.log('generate_thumbnail');
                    if (inx == file_paths.length) return;
                    console.log('line 120');
                    let path = file_paths[inx];
                    console.log('line 122');
                    // let image = generator.getThumbnail(path);
                    database.getMediaInfo(path, (err, row) => {
                        if(err){
                            console.log('error in line 124');
                            console.log(err);
                        }
                        if (row) {
                            console.dump(row);
                        
                            // paths.push({'path' :row.PATH ,'image':imageSource.fromNativeSource(row.THUMBNAIL)});
                            // let img = row.THUMBNAIL ? imageSource.fromNativeSource(row.THUMBNAIL) : null;
                            // console.log(img);
                            paths.push({'path' :row.PATH ,'image':row.THUMBNAIL});
                            // paths.push({'path' :row.PATH ,'image':null});
                            subscriber.next(paths);

                            timer.setTimeout(function() { generate_thumbnail(inx + 1)} ,0);

                        }
                        else {
                            console.log('line 137');
                            worker.postMessage(path);
                            console.log('line 139');

                            worker.onmessage = (msg) => {
                                let image = msg.data;
                                database.getMediaInfo(path, (err, row) => {

                                    console.log('error in line 142');
                                    console.log(err);
                                    console.dump(row);
                                    // let img = row.THUMBNAIL ? imageSource.fromNativeSource(row.THUMBNAIL) : null;
                                    // console.log(img);
                                    paths.push({'path' :row.PATH ,'image':row.THUMBNAIL});
                                    // paths.push({'path' :row.PATH ,'image':img });
                                    // paths.push({'path' :row.PATH ,'image':null});
                                    subscriber.next(paths);
                                });
                                // generate_thumbnail(inx + 1);
                                timer.setTimeout(function() { generate_thumbnail(inx + 1)} ,0);
                            }
                        }
                    });


                }
                generate_thumbnail(0);
            }
            // subscriber.next(paths);

        });

    }
}
