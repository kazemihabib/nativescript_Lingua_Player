//If path is subPaht of another one app should not allow to add it and say it's subPath of another one
import { Injectable } from '@angular/core';
import application = require("application");
// import {ThumbnailGenerator} from '../utils/thumbnailGenerator';
var fs = require("file-system");

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

        let paths = [];
        let MediaStore = android.provider.MediaStore;
        let Uri = android.net.Uri;
        let Cursor = android.content.Context;

        let uri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
        let projection = [MediaStore.Video.VideoColumns.DATA];
        let c = application.android.context.getContentResolver().query(uri, projection, null, null, null);

        return RxObservable.create(subscriber => {
            let worker = new Worker('../workers/setMediaInfo.worker');

            let file_paths: string[] = [];
            if (c != null) {
                let temp;
                while (temp = c.moveToNext()) {
                    let path: string = c.getString(0); // give path
                    file_paths.push(path);
                }
                c.close();
            }

            if (file_paths.length) {

                if (!database.isDatabaseReady()) {
                    database.initDataBase();
                }

                let addToListView = (mediaInfo: any) => {
                    let exists = fs.File.exists(mediaInfo.PATH);
                    if (exists) {
                        paths.push(mediaInfo);
                        subscriber.next(paths);
                    }
                }


                let generate_thumbnail = (inx) => {
                    if (inx == file_paths.length) return;
                    let path = file_paths[inx];

                    database.getMediaInfo(path, (err, row) => {
                        if (err) {
                            console.log(err);
                        }
                        if (row) {

                            addToListView(row);
                            timer.setTimeout(function () { generate_thumbnail(inx + 1) }, 0);

                        }
                        else {
                            worker.postMessage(path);

                            worker.onmessage = (msg) => {
                                let mediaInfo = msg.data;
                                addToListView(mediaInfo);
                                timer.setTimeout(function () { generate_thumbnail(inx + 1) }, 0);
                            }
                        }
                    });

                }
                generate_thumbnail(0);
            }

        });

    }
}