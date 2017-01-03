//If path is subPath of another one app should not allow to add it and say it's subPath of another one
import { Injectable } from '@angular/core';
import application = require("application");
// import {ThumbnailGenerator} from '../utils/thumbnailGenerator';
import fs = require("file-system");

import { Observable as RxObservable } from 'rxjs/Observable';
import timer = require("timer");
import imageSource = require("image-source");
import database = require('../utils/media.database');

import {VideoInfo} from "../models/videoInfo.model";

declare var android: any;
declare var org: any;


export class FileExplorer {

    private worker;
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

        let paths : VideoInfo[] = [];
        let MediaStore = android.provider.MediaStore;
        let Uri = android.net.Uri;
        let Cursor = android.content.Context;

        let notExistVideos :string[] = []

        let uri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
        let projection = [MediaStore.Video.VideoColumns.DATA];
        let c = application.android.context.getContentResolver().query(uri, projection, null, null, null);

        if (!database.isDatabaseReady()) {
            database.initDataBase();
        }

        return RxObservable.create(subscriber => {
            this.worker = new Worker('../workers/setMediaInfo.worker');

            let file_paths: VideoInfo[] = [];
            if (c != null) {
                let temp;
                while (temp = c.moveToNext()) {
                    let path: string = c.getString(0); // give path
                    let exists = fs.File.exists(path);
                    if(exists)
                        file_paths.push(new VideoInfo(path));
                    else
                        notExistVideos.push(path)
                }
                c.close();
                subscriber.next(file_paths);
            }
            
            if(notExistVideos.length){
                notExistVideos.forEach((path) => {
                    database.deleteRow(path, (err, id) => {
                        if (err)
                            console.log(err);
                        if (id)
                            console.log(id);
                    })

                })

            }

            if (file_paths.length) {



                let addToListView = (mediaRow:any , index:number) => {
                        let videoInfo = file_paths[index];

                        videoInfo.position = mediaRow.POSITION;
                        videoInfo.length = mediaRow.LENGTH;
                        videoInfo.subLocation = mediaRow.SUBLOCATION;
                        videoInfo.thumbnail = mediaRow.THUMBNAIL;

                }


                let generate_thumbnail = (inx) => {
                    if (inx == file_paths.length){
                        this.worker.terminate();
                        return subscriber.complete();
                    }
                    let path = file_paths[inx].path;


                    database.getMediaInfo(path, (err, row) => {
                        if (err) {
                            console.log(err);
                        }
                        if (row) {
                            
                            addToListView(row,inx);
                            timer.setTimeout(function () { generate_thumbnail(inx + 1) }, 0);

                        }
                        else {
                            this.worker.postMessage(path);

                            this.worker.onmessage = (msg) => {
                                let mediaInfo = msg.data;
                                addToListView(mediaInfo,inx);
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