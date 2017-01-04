import { Component, OnInit, NgZone } from "@angular/core";
import application = require("application");
import { Router } from "@angular/router";
import { chroma, HW, VLCSettings } from "../../components/VLCSettings";
import { ListViewEventData, RadListView } from "nativescript-telerik-ui/listview";
import { ObservableArray } from "data/observable-array";
import { Observable as RxObservable } from 'rxjs/Observable';

import dialogs = require("ui/dialogs");
import frame = require("ui/frame");
import fs = require("file-system");

import { VideoExplorer } from "../../services/video-explorer.service";
import { Brightness } from '../../utils/brightness';

import { VideoInfo } from "../../models/videoInfo.model";

var database = require('../../utils/media.database');

@Component({
    selector: "home",
    templateUrl: "pages/home/home.component.html",
    styleUrls: ["pages/home/home.component.css"],
    providers: [VideoExplorer],
})

export class HomeComponent implements OnInit {

    private statusBarHeight = 0;

    private paths: ObservableArray<VideoInfo>;

    private source: RxObservable<VideoInfo[]>;


    constructor(private _router: Router, private videoExplorer: VideoExplorer, private _ngZone: NgZone) { }

    public play(path: string, position: number) {
        this._router.navigate(["/player", { path: path, position: position }]);
    }

    public ngOnInit() {
        // this.statusBarHeight = this.getStatusBarHeight();
        VLCSettings.hardwareAcceleration = HW.HW_ACCELERATION_FULL;
        VLCSettings.networkCachingValue = 3000;
        this.source = this.videoExplorer.explore();
        let subscription = this.source.subscribe(
            (paths) => {
                this._ngZone.run(() => {
                    this.paths = new ObservableArray(paths);
                });
            },

            (error)=>{
                console.log('error in videoExplorer subscribe');
            },

            ()=>{
                console.log('loading videos finished');
            }
        )

    }

    private revertBrightness() {
        Brightness.setBrightness(-1);
    }

    private getStatusBarHeight() {
        //this will not call because of problems in android 6
        let result: number = 0;
        let resourceId: number = application.android.context.getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) {

            result = application.android.context.getResources().getDimensionPixelSize(resourceId);
        }
        return result;
    }

    private loaded() {
        this.revertBrightness();
        //show status bar (for situations it was hide in the player component)
        frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_VISIBLE);
    }

    private onItemTap(args: any) {
        var listview = args.object as RadListView;
        var selectedItems = listview.getSelectedItems();
        let path = selectedItems[0]['path'];
        let exists = fs.File.exists(path);

        if (!database.isDatabaseReady()) {
            database.initDataBase();
        }
        if (!exists) {
            dialogs.alert("Video not found").then(() => {
                console.log("Video not found");
            });
            //remove that path from paths and db
            let index = this.paths.lastIndexOf(selectedItems[0]);
            this.paths.splice(index, 1);

            database.deleteRow(path, (err, id) => {
                if (err)
                    console.log(err);
                if (id)
                    console.log(id);
            })
            return;
        }

        let URIPath = 'file://' + path;

        database.getMediaInfo(path, (err, row) => {
            if (row) {
                let position = row.POSITION;
                this.play(URIPath, position);
            }
            if (err) {
                this.play(URIPath, 0);
            }
        });
    }

}
