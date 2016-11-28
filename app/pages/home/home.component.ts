﻿import {Component,OnInit,AfterViewInit,NgZone} from "@angular/core";
import application = require("application");
import {Router} from "@angular/router";
import {chroma,HW,VLCSettings} from "../../components/VLCSettings";
import { ListViewEventData, RadListView } from "nativescript-telerik-ui/listview";

import {FileExplorer} from "../../services/fileExplorer.service";
import {Brightness} from '../../utils/brightness';

@Component({
    selector: "home",
    templateUrl: "pages/home/home.component.html",
    providers:[FileExplorer],
})

export class firstPage implements OnInit, AfterViewInit{

   private statusBarHeight = 0;
   
//    paths:Array<string> = [];
   paths:any = [];
   path:string = 'file:///sdcard/Download/hello/si.mkv';

    public counter:number;
    
   constructor(private _router: Router,private fileExplorer:FileExplorer, private _ngZone: NgZone){
   }

   public play(){
      this._router.navigate(["/player",{path:this.path}]);
   }

   public ngAfterViewInit(){}
   public ngOnInit(){
    
    this.statusBarHeight= this.getStatusBarHeight(); 
    VLCSettings.hardwareAcceleration = HW.HW_ACCELERATION_FULL;
    VLCSettings.networkCachingValue = 3000;
    // this.source= this.fileExplorer.explore();
    // let subscription = this.source.subscribe(
    //     (path)=>{
    //         this._ngZone.run(() => {
    //                 this.paths = path;
    //         });
    //     }
            
    // )
   }

    private revertBrightness(){
      Brightness.setBrightness(-1);
    }

    private getStatusBarHeight() {
      let result:number = 0;
      let resourceId:number = application.android.context.getResources().getIdentifier("status_bar_height", "dimen", "android");
      if (resourceId > 0) {

          result = application.android.context.getResources().getDimensionPixelSize(resourceId);
      }
      return result;
    } 

    public source:any;
    public loaded(){
        this.revertBrightness();

        //moved to ngOnInit until use worker and database for this

        this.source= this.fileExplorer.explore();
        let subscription = this.source.subscribe(
            (path)=>{
                this.paths = path;
            }
                
        )

    }

    public unLoaded(){
    }

    public onItemTap(args:any){
        var listview = args.object as RadListView;
        var selectedItems = listview.getSelectedItems();
        // console.log('selected' , selectedItems);
        this.path = 'file://'+ selectedItems[0]['path'];
        this.play();
    }

}
