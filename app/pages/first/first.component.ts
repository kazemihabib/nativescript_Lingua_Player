import 'reflect-metadata';
import {Component,OnInit} from "@angular/core";
import application = require("application");
// import {View} from "ui/core/view";
import {Router} from "@angular/router";
import {chroma,HW,VLCSettings} from "../../components/VLCSettings";
// import fs = require("file-system");
// import {Folder} from 'file-system';

import {FileExplorer} from "../../services/fileExplorer.service";

// class DataItem {
//     constructor(public id: number, public name: string) {}
// }

@Component({
    selector: "first",
    templateUrl: "pages/first/first.html",
    providers:[FileExplorer],
})

export class firstPage{

   private statusBarHeight = 0;
   
   paths:Array<string> = [];
   path:string = 'file:///sdcard/Download/hello/si.mkv';

    // public myItems:Array<DataItem>;
    public counter:number;
    
   constructor(private _router: Router,private fileExplorer:FileExplorer){
        // this.myItems = [];
        // this.counter = 0;
        // for (var i = 0; i < 50; i++) {
        //     this.myItems.push(new DataItem(i, "data item " + i));
        //     this.counter = i;
        // }

   }

   public play(){
      this._router.navigate(["/player",{path:this.path}]);
   }

   public ngOnInit(){
    
    this.statusBarHeight= this.getStatusBarHeight(); 
    // console.log('hardwareAcceleration before set settings: ' +VLCSettings.hardwareAcceleration);
    // console.log('netowrkCachingValue before set settings: ' + VLCSettings.networkCachingValue)
    
    VLCSettings.hardwareAcceleration = HW.HW_ACCELERATION_DISABLED;
    VLCSettings.networkCachingValue = 3000;


    // console.log('hardwareAcceleration after set settings: ' + VLCSettings.hardwareAcceleration);
    // console.log('networkCachingValue after set settings: ' + VLCSettings.networkCachingValue)
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
    //   console.log('fist.components loaded');
      // var sourceFile = fs.File.fromPath("/storage/emulated/0/Download/");
    //   let sourceFile = fs.Folder.fromPath("/storage/emulated/0/");
    //   console.dump(sourceFile.parent);
      
      // console.log(sourceFile);
      // console.dump(sourceFile);
      
      // sourceFile.eachEntity(function (entity) {
      //     // console.log(entity.name + " --> " + entity.parent.name);
      //     console.dump(entity);
          
      //     // Return true to continue, or return false to stop the iteration.
      //     return true;
      // });
      // console.dump(sourceFile);
        this.paths = this.fileExplorer.explore()


        // this.paths.push('habib');
        // this.paths.push('rashid');

        // console.log(this.paths);
        // let i = 0;
        // setInterval(()=> {
        //     this.paths.push('goog');
        // }, 1000);
    }

    public unLoaded(){
    //   console.log('firs.components unloaded');
    //   this.paths.push('kazemi');
    //   this.paths.push('kazemi2');
    }

    public onItemTap(obj:any){
        // console.log(obj.index);
        // console.log(this.paths[obj.index]);
        this.path ='file://' +  this.paths[obj.index];
    }

}
