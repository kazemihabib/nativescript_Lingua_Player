import {Component,OnInit} from "@angular/core";
import application = require("application");
import {Router} from "@angular/router";
import {chroma,HW,VLCSettings} from "../../components/VLCSettings";

import {FileExplorer} from "../../services/fileExplorer.service";
import {Brightness} from '../../utils/brightness';


@Component({
    selector: "first",
    templateUrl: "pages/first/first.html",
    providers:[FileExplorer],
})

export class firstPage{

   private statusBarHeight = 0;
   
   paths:Array<string> = [];
   path:string = 'file:///sdcard/Download/hello/si.mkv';

    public counter:number;
    
   constructor(private _router: Router,private fileExplorer:FileExplorer){
   }

   public play(){
      this._router.navigate(["/player",{path:this.path}]);
   }

   public ngOnInit(){
    
    this.statusBarHeight= this.getStatusBarHeight(); 
    VLCSettings.hardwareAcceleration = HW.HW_ACCELERATION_DISABLED;
    VLCSettings.networkCachingValue = 3000;
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

    public loaded(){
        this.revertBrightness();
        this.paths = this.fileExplorer.explore()
    }

    public unLoaded(){
    }

    public onItemTap(obj:any){
        this.path ='file://' +  this.paths[obj.index];
    }

}
