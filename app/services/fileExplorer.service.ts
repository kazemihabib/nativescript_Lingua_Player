//If path is subPath of another one app should not allow to add it and say it's subPath of another one
import { Injectable } from '@angular/core';
import application = require("application");
// import {ThumbnailGenerator} from '../utils/thumbnailGenerator';
import fs = require("file-system");

import { Observable as RxObservable } from 'rxjs/Observable';
import timer = require("timer");
import imageSource = require("image-source");
import database = require('../utils/media.database');

import { VideoInfo } from "../models/videoInfo.model";

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

    private videoInformations: VideoInfo[] = [];
    private subscriber: any;





    private mediaStoreQuery(): [VideoInfo[], string[]] {

        let MediaStore = android.provider.MediaStore;
        let Uri = android.net.Uri;
        let Cursor = android.content.Context;

        let notExistVideos: string[] = []

        let uri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
        let projection = [MediaStore.Video.VideoColumns.DATA];
        let c = application.android.context.getContentResolver().query(uri, projection, null, null, null);

        let videoInformations: VideoInfo[] = [];
        if (c != null) {
            let temp;
            while (temp = c.moveToNext()) {
                let path: string = c.getString(0); // give path
                let exists = fs.File.exists(path);
                if (exists) videoInformations.push(new VideoInfo(path));
                else notExistVideos.push(path)
            }
            c.close();

            return [videoInformations, notExistVideos];
        }

    }

    private removeNotExistRows(notExistVideos: string[]) {
        if (notExistVideos.length) {
            notExistVideos.forEach((path) => {
                database.deleteRow(path, (err, id) => {
                    if (err) console.log(err);
                    if (id) console.log(id);
                })
            })
        }

    }

    public explore() {

        if (!database.isDatabaseReady()) {
            database.initDataBase();
        }

        this.worker = new Worker('../workers/setMediaInfo.worker');

        let notExistVideos: string[] = [];

        [this.videoInformations, notExistVideos] = this.mediaStoreQuery();
        this.removeNotExistRows(notExistVideos);

        return RxObservable.create(subscriber => {
            this.subscriber = subscriber;
            subscriber.next(this.videoInformations);

            let setDetailsOfVideoInformations = (mediaRow: any, index: number) => {
                let videoInfo = this.videoInformations[index];

                videoInfo.position = mediaRow.POSITION;
                videoInfo.length = mediaRow.LENGTH;
                videoInfo.subLocation = mediaRow.SUBLOCATION;
                videoInfo.thumbnail = mediaRow.THUMBNAIL;
            }


            let getVideoInfo = (inx) => {
                let that = this;

                if (inx == this.videoInformations.length) {
                    this.worker.terminate();
                    return this.subscriber.complete();
                }

                let path = this.videoInformations[inx].path;

                database.getMediaInfo(path, (err, row) => {
                    if (err) {
                        console.log(err);
                    }
                    if (row) {

                        setDetailsOfVideoInformations(row, inx);
                        timer.setTimeout(function () { getVideoInfo(inx + 1) }, 0);

                    }
                    else {
                        this.worker.postMessage(path);

                        this.worker.onmessage = (msg) => {
                            let mediaInfo = msg.data;
                            setDetailsOfVideoInformations(mediaInfo, inx);
                            timer.setTimeout(function () { getVideoInfo(inx + 1) }, 0);
                        }
                    }
                });
            }

            if (this.videoInformations.length) {
                getVideoInfo(0);
            }

        });
    }
}