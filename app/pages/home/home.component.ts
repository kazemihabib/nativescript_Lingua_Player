import { Component, OnInit, AfterViewInit, NgZone } from "@angular/core";
import application = require("application");
import { Router } from "@angular/router";
import { chroma, HW, VLCSettings } from "../../components/VLCSettings";
import { ListViewEventData, RadListView } from "nativescript-telerik-ui/listview";
import { ObservableArray } from "data/observable-array";

import dialogs = require("ui/dialogs");
let frame = require("ui/frame");
var fs = require("file-system");

import { FileExplorer } from "../../services/fileExplorer.service";
import { Brightness } from '../../utils/brightness';

var database = require('../../utils/media.database');

@Component({
    selector: "home",
    templateUrl: "pages/home/home.component.html",
    providers: [FileExplorer],
})

export class firstPage implements OnInit, AfterViewInit {

    private statusBarHeight = 0;

    paths:ObservableArray<any>;
    path: string;

    public counter: number;

    constructor(private _router: Router, private fileExplorer: FileExplorer, private _ngZone: NgZone) {
    }

    public play(path:string, position:number) {
        this._router.navigate(["/player", { path: path, position: position}]);
    }

    public ngAfterViewInit() { }
    public ngOnInit() {
        this.statusBarHeight = this.getStatusBarHeight();
        VLCSettings.hardwareAcceleration = HW.HW_ACCELERATION_FULL;
        VLCSettings.networkCachingValue = 3000;
        this.source = this.fileExplorer.explore();
        let subscription = this.source.subscribe(
            (path) => {
                this._ngZone.run(() => {
                    this.paths = new ObservableArray(path);
                    // this.paths = path;
                });
            }

        )

    }

    private revertBrightness() {
        Brightness.setBrightness(-1);
    }

    private getStatusBarHeight() {
        let result: number = 0;
        let resourceId: number = application.android.context.getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) {

            result = application.android.context.getResources().getDimensionPixelSize(resourceId);
        }
        return result;
    }

    public source: any;
    public loaded() {
        this.revertBrightness();
        frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_VISIBLE );
    }

    public unLoaded() {
    }

    public onItemTap(args: any) {
        var listview = args.object as RadListView;
        var selectedItems = listview.getSelectedItems();
        let path = selectedItems[0]['PATH'];
        let exists = fs.File.exists(path);

        if (!database.isDatabaseReady()) {
            database.initDataBase();
        }
        if(!exists){
            dialogs.alert("Video not found").then(() => {
                console.log("Video not found");
            });
            let index = this.paths.lastIndexOf(selectedItems[0]);
            this.paths.splice(index, 1); 
            database.deleteRow(path,(err,id)=>{
                if(err)
                    console.log(err);
                if(id)
                    console.log(id);
            })
            return;
        }

        let URIPath = 'file://' + path;

        database.getMediaInfo(path, (err,row)=>{
            if(row){
               let position = row.POSITION; 
               this.play(URIPath, position);
            }
            if(err){
               this.play(URIPath, 0);
            }
        });
    }

}
