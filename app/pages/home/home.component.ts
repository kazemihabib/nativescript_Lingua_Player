import { Component, OnInit, NgZone, ViewContainerRef } from "@angular/core";
import application = require("application");
import { Router } from "@angular/router";
import { chroma, HW, VLCSettings } from "../../components/VLCSettings";
import { ListViewEventData, RadListView } from "nativescript-telerik-ui/listview";
import { ObservableArray } from "data/observable-array";
import { Observable as RxObservable } from 'rxjs/Observable';
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular/modal-dialog";

import dialogs = require("ui/dialogs");
import frame = require("ui/frame");
import fs = require("file-system");

import { VideoExplorer } from "../../services/video-explorer.service";
import { Brightness } from '../../utils/brightness';

import { VideoInfo } from "../../models/videoInfo.model";
import {NotFound } from "../../dialogs/not_found/not_found";
import {PermissionNotGranted} from "../../dialogs/permission_not_granted/permission_not_granted";

import { registerElement } from "nativescript-angular/element-registry";
import { PullToRefresh } from "nativescript-pulltorefresh";
import timer = require("timer")
import * as permissions from "nativescript-permissions";
 
registerElement("pullToRefresh",() => require("nativescript-pulltorefresh").PullToRefresh);

var database = require('../../utils/media.database');

@Component({
    selector: "home",
    templateUrl: "pages/home/home.component.html",
    styleUrls: ["pages/home/home.component.css"],
    providers: [VideoExplorer],
})

export class HomeComponent implements OnInit {

    private statusBarHeight = 0;
    
    //if I don't initialize it here it will be undefined 
    //and granted will no
    private paths: ObservableArray<VideoInfo> = new ObservableArray([]);

    private source: RxObservable<ObservableArray<VideoInfo>>;
    
    private powerManager:any;


    constructor(private _router: Router, private videoExplorer: VideoExplorer, private _ngZone: NgZone,
        private viewContainerRef: ViewContainerRef,private modalService: ModalDialogService) { }

    public play(path: string, position: number) {
        this._router.navigate(["/player", { path: path, position: position }]);
    }

    public ngOnInit() {
        // this.statusBarHeight = this.getStatusBarHeight();
        VLCSettings.hardwareAcceleration = HW.HW_ACCELERATION_FULL;
        VLCSettings.networkCachingValue = 3000;
        this.refresh();

    }

    private refresh(){
        permissions.requestPermission(android.Manifest.permission.READ_EXTERNAL_STORAGE)
            .then(()=>{
                this.source = this.videoExplorer.explore(this._ngZone);
                let subscription = this.source.subscribe(
                    (paths:ObservableArray<VideoInfo>) => {
                        this._ngZone.run(() => {
                            this.paths = paths;
                        });
                    },

                    (error)=>{
                        console.log('error in videoExplorer subscribe');
                    },

                    ()=>{
                        console.log('loading videos finished');
                    }
                )
            })
            .catch(()=>{
                let options: ModalDialogOptions = {
                    context: {},
                    viewContainerRef: this.viewContainerRef
                };
                this.modalService.showModal(PermissionNotGranted, options).then((res: string) => {this.refresh() });
            });



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

            let videoTitle = fs.File.fromPath(path.replace('file://', '')).name;
            let options: ModalDialogOptions = {
                context: {videoTitle:videoTitle},
                viewContainerRef: this.viewContainerRef
            };

            this.modalService.showModal(NotFound, options).then((res: string) => { });

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
            else if (err) {
                this.play(URIPath, 0);
            }
            else    
                //not exist in database so it never started
                this.play(URIPath,0);
        });
    }

    public onPullToRefreshInitiated(args: ListViewEventData) {
        var listView = args.object;
        //I can not put this in complete of subscriber 
        //because if I put there it will never end
        //https://github.com/telerik/nativescript-ui-feedback/issues/64
        listView.notifyPullToRefreshFinished();

        timer.setTimeout(()=>{
            this.refresh();
        },0)
    }

}
