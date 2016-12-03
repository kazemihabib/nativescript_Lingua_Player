import {Component,OnInit,NgZone} from "@angular/core";
import {
    FlexboxLayout,
    FlexDirection,
    FlexWrap,
    JustifyContent,
    AlignItems,
    AlignContent,
    AlignSelf
} from "ui/layouts/flexbox-layout";

import application = require("application");
import {VLCComponent} from "../../components/vlc.component";
import {ActivatedRoute} from "@angular/router";
import appSettings = require("application-settings");
import {registerElement} from "nativescript-angular/element-registry";
import { RouterExtensions } from "nativescript-angular/router";
let frame = require("ui/frame");
import {Subtitle} from "../../services/subtitle.service";
import {IGuestureEventCallbacks} from "./guesture.interface"; 
var database = require('../../utils/media.database');

registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown);
registerElement("TNSSlider", () => require("nativescript-slider").Slider);
import  timer = require("timer")

import {Guestures} from './guestures'

declare var android:any;


@Component({
    selector: "player",
    templateUrl: "pages/player/player.component.html",
    providers:[Subtitle]
})


export class playerPage implements OnInit{

    vlc;
    vlcAction;
    private sub:any;
    public path:string;
    public position:number = 0;
    public currentAspectRatio = 0;
    public currentAudioTrack = -1;
    public audioTracks = new Array<{id:number,name:string}>();
    public dd:any;

    public visible:boolean = true;
    
    public isSubEmpty:boolean = true;

    public isRTL:boolean = false;

    public subWordListDownloader = (wordList) => {
      this._ngZone.run(() => {
          this.subText = wordList;
      });
    }

    public subText=[{'text':'','isWord':false}];

    currentPosition = 0; 
    movieLength = 0;
    eventHardwareAccelerationError = function(){
        console.log("event: eventHardwareAccelerationError");
    }
    eventEndReached(){
       console.log('eventEndReached');
       this.position = 0;
       this.save();
       this.routerExtensions.back();
    }
    eventPlaying = function(){
        console.log('event : Playing');
    }
    eventTimeChanged(){
      this.currentPosition = this.vlcAction.getPosition();
      this.getSubtitleDialog();
    }

    getSubtitleDialog(){
      let wordList = this.subtitle.getDialogWordList(this.currentPosition);

      this.isSubEmpty = wordList.length == 0;

      this._ngZone.run(() => {
        if(!this.isSubEmpty)
          this.subText = wordList;

      });
    }   

    fromUser(args){
      this.vlcAction.seek(args.newValue);
      this.eventTimeChanged();
    }

    eventParsedChanged = function(){
     {

      this.movieLength = this.vlcAction.getLength();
    }
  }

    dropDownLoaded(dd){
      this.dd = dd;
    }


    public label1GuestureHandler= null;
    public label2GuestureHandler = null;

    label2Loaded(lbl){
      this.label2GuestureHandler = lbl;

      let guestures = new Guestures(this.vlcAction,this.guestureEventCallbacks);
      guestures.rightSideguestures(lbl);
    }

    label1Loaded(lbl){
      this.label1GuestureHandler = lbl;

      let guestures = new Guestures(this.vlcAction, this.guestureEventCallbacks);
      guestures.leftSideguestures(lbl);

    }

    //TODO:change this method name
    onLoaded(vlc){
      this.vlc = vlc;
      this.vlcAction = this.vlc.getVLCAction();
      timer.setTimeout(()=>{
        this.vlcAction.play();
      },0);

      this.subtitle.addSubWordListDownloader(this.subWordListDownloader);
    }
    constructor(private route: ActivatedRoute,private _ngZone: NgZone,private subtitle:Subtitle,private routerExtensions: RouterExtensions){}

    ngOnDestroy() {
      this.sub.unsubscribe();
    }
    ngOnInit(){
    
     this.statusBarHeight= this.getStatusBarHeight(); 
     this.sub = this.route.params.subscribe(params => {
       let id = +params['id'];
       this.path = params['path'];
       console.log('path in player ',this.path);
       this.position = parseInt(params['position']);
      //  this.position = 0;
       console.log('in ngOnInit ');
       console.log(typeof this.position);
       console.log(this.position);
     });

    //  this.position = appSettings.getNumber(this.path,0);

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
    //TODO:change this member name
    public sta=true;

    public hideBars(){
      if(this.sta){

          frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_FULLSCREEN);
          let page = frame.topmost().currentPage;

          page.actionBarHidden = true;

          this._ngZone.run(() => {
            this.visible = false;
          });
      }
      else{

          frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_VISIBLE );
          let page = frame.topmost().currentPage;
          page.actionBarHidden = false;
          this._ngZone.run(() => {
            this.visible = true;
          });
      }

    this.sta=!this.sta;
    }

    public save(){
      // appSettings.setNumber(this.path, this.position);
      // let stringPosition = this.position.toString();
      // console.log('before save ',stringPosition);
      database.updatePosition(this.path.replace('file://',''), this.position);
    }

    public changeAspectRatio(){
      let currentAspectRatio = this.vlc.getCurrentAspectRatioItem();
      console.log('currentAspectRatio' + currentAspectRatio.name);
      this.currentAspectRatio = (currentAspectRatio.value + 1) % 7;
    }



    public loaded(){
    }

    public unLoaded(){
    }


     public addSub(){
      this.subtitle.loadSubtitle('sdcard/Download/han.srt',(isRTL:boolean, success:boolean, err:any)=>{
          console.log('sub Load success: ',success);
          console.log('sub err: ',err)
          this.isRTL = isRTL;
      });
    }

    public subTapped(item:{'text': '','isWord':false,'isNotWord':false,'isLine':false}){
      console.log(item.text);
    }

    public guestureEventCallbacks : IGuestureEventCallbacks =  {
      seekEventFired:()=>{
        this.eventTimeChanged();
        console.log('seekEventFired');
      },
      volumeEventFired:()=>{
        console.log('volumeEventFired');
      },
      brightnessEventFired:()=>{
        console.log('brightnessEventFired');
      }

    }

}
