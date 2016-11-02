import 'reflect-metadata';
import {Component,OnInit,NgZone} from "@angular/core";
import application = require("application");
import {VLCComponent} from "../../components/vlc.component";
import {ActivatedRoute} from "@angular/router";
import appSettings = require("application-settings");
import {registerElement} from "nativescript-angular/element-registry";
let frame = require("ui/frame");
import gestures = require("ui/gestures");
import {Subtitle} from "../../services/subtitle.service";

registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown);
registerElement("TNSSlider", () => require("nativescript-slider").Slider);
import  timer = require("timer")

import {Guestures} from './guestures'


declare var android:any;

export enum Direction{
  vertical,
  horizontal
}

@Component({
    selector: "player",
    templateUrl: "pages/player/player.html",
    providers:[Subtitle]
})


export class playerPage implements OnInit{

    // public init = false;
    vlc;
    vlcAction;
    private sub:any;
    public path:string;
    public position:number = 0;
    public currentAspectRatio = 0;
    public currentAudioTrack = -1;
    public selectedIndex = 0;
    // public items:Array<number>=[-1];
    public audioTracks = new Array<{id:number,name:string}>();
    public dd:any;

    public subText=[{'text':'','isWord':false}];

    text = 8;
    currentPosition = 0; 
    movieLength = 0;
    eventHardwareAccelerationError = function(){
        console.log("event: eventHardwareAccelerationError");
    }
    eventPlaying = function(){
        console.log('event : Playing');
    }
    eventTimeChanged(){

      this.currentPosition = this.vlcAction.getPosition();
      let text = this.subtitle.getText(this.currentPosition);
      // this.isSub = text != -1 ? true:false; 
      this._ngZone.run(() => {
        this.subText = text;
        // console.dump(this.subText);
      });
        // console.log(currentPosition);
        // console.log(text);

      // console.log(this.currentPosition);
    }

    fromUser(args){
      console.log("fromUser");
      console.log("new Value " + args.newValue);
      console.log(args.object);
      this.vlcAction.seek(args.newValue);
    }

    eventParsedChanged = function(){
     {

      this.movieLength = this.vlcAction.getLength();
      // this.audioTracks = this.vlc.getAudioTracks();
      // let _current = this.vlc.audioTrack;
      // this.items = [];
      // this.audioTracks.forEach(
      //   (element,index,array)=>{
      //     this.items.push(element.id);
      //     if(element.id == _current)
      //       this.selectedIndex = index;
      //   }
      // )
      // this.dd.items = this.items;
      // this.dd.selectedIndex = this.selectedIndex;
    }
  }

    dropDownLoaded(dd){
      this.dd = dd;
    }

    public isTouching:boolean = false;
    public currentVolume = 15;
    public prevDelta = 0;

    //------------------
    public op = 0.9;
    public prevY:number = null;
    public prevX:number = null;
    public label1GuestureHandler= null;
    public label2GuestureHandler = null;
    private direction = null;

    // public sleep = null;
    label2Loaded(lbl){
      this.label2GuestureHandler = lbl;

      let guestures = new Guestures(this.vlcAction);
      guestures.rightSideguestures(lbl);
    }

    public label1TouchGesture = null;
    label1Loaded(lbl){
      this.label1GuestureHandler = lbl;

      let guestures = new Guestures(this.vlcAction);
      guestures.leftSideguestures(lbl);

    }


    onLoaded(vlc){
      this.vlc = vlc;
      this.vlcAction = this.vlc.getVLCAction();
      timer.setTimeout(()=>{
        this.vlcAction.play();
      },0);
    }
    constructor(private route: ActivatedRoute,private _ngZone: NgZone,private subtitle:Subtitle){}

    ngOnDestroy() {
      this.sub.unsubscribe();
    }
    ngOnInit(){
    
     this.statusBarHeight= this.getStatusBarHeight(); 
     this.sub = this.route.params.subscribe(params => {
       let id = +params['id'];
       this.path = params['path'];
     });

     this.position = appSettings.getNumber(this.path,0);

      application.android.off(application.AndroidApplication.activityPausedEvent)
      application.android.on(application.AndroidApplication.activityPausedEvent,
        function (args: application.AndroidActivityEventData) {
          this.vlc.stopPlayback();
          this.position = this.vlc.lastPosition;
          this.save();
          this.label2GuestureHandler.off('touch',function(args){});
          this.label1GuestureHandler.off('touch',function(args){});
      },this);

      application.android.off(application.AndroidApplication.activityDestroyedEvent);
      application.android.on(application.AndroidApplication.activityDestroyedEvent,
        function (args: application.AndroidActivityEventData) {
          this.vlc.stopPlayback();
          this.position = this.vlc.lastPosition;
          this.save();
        },this);

      application.android.off(application.AndroidApplication.activityBackPressedEvent);
      application.android.on(application.AndroidApplication.activityBackPressedEvent,
        function (args) {
          this.vlc.stopPlayback();
          this.position = this.vlc.lastPosition;
          this.save();
      },this);
    }

    public statusBarHeight=0;
    private getStatusBarHeight() {
      let result:number = 0;
      let resourceId:number = application.android.context.getResources().getIdentifier("status_bar_height", "dimen", "android");
      if (resourceId > 0) {

          result = application.android.context.getResources().getDimensionPixelSize(resourceId);
      }
      return result;
    } 

    public sta=true;

    public hideBars(){
      if(this.sta){

          frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_FULLSCREEN);
          let page = frame.topmost().currentPage;
          console.log('page'+ page);

          page.actionBarHidden = true;

          console.log('op '+ this.op);

          this._ngZone.run(() => {
            this.op = 0;
          });
      }
      else{

          frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_VISIBLE );
          let page = frame.topmost().currentPage;
          page.actionBarHidden = false;
          this._ngZone.run(() => {
            this.op = 0.6;
          });
      }

    this.sta=!this.sta;
    console.log('sta' + this.sta);
    }
    public up(){
      let obj = this.vlcAction.volumeUp();
      console.log('currentVolume : ' + obj.currentVolume);
      console.log('maxVolume ' + obj.maxVolume);
    }

    public save(){
      appSettings.setNumber(this.path, this.position);
    }

    public changeAspectRatio(){
      let currentAspectRatio = this.vlc.getCurrentAspectRatioItem();
      console.log('currentAspectRatio' + currentAspectRatio.name);
      this.currentAspectRatio = (currentAspectRatio.value + 1) % 7;
    }


    // public onchange(indx){
        // this.currentAudioTrack = this.items[indx];
    // }

    public loaded(){
      console.log('player.components loaded');
    }

    public unLoaded(){
      console.log('player.components unloaded');
    }


    public reChange(){
      let lp = application.android.foregroundActivity.getWindow().getAttributes();
      lp.screenBrightness = 254 / 255;
      application.android.foregroundActivity.getWindow().setAttributes(lp);
    }

     public addSub(){
      this.subtitle.loadSubtitle('sdcard/Download/han.srt');
    }

}
