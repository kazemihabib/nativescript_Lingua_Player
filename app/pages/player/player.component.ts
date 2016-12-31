﻿import {Component,OnInit,NgZone,ViewContainerRef} from "@angular/core";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular/modal-dialog";
import {FilePicker} from "../../dialogs/file_picker/file_picker_dialog";
import {AccelerationSelector} from "../../dialogs/acceleration_selector/acceleration_selector";
import {AudioSelector} from "../../dialogs/audio_selector/audio_selector";
import {ResumeConfirm} from "../../dialogs/resume_confirm/resume_confirm";
import { chroma, HW, VLCSettings } from "../../components/VLCSettings";
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
import dialogs = require("ui/dialogs");
var database = require('../../utils/media.database');
import fs = require("file-system");

registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown);
registerElement("TNSSlider", () => require("nativescript-slider").Slider);
import  timer = require("timer")

import {Guestures} from './guestures'

declare var android:any;
declare var com:any;


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
    public currentAudioTrack = 0;
    // public audioTracks = new Array<{id:number,name:string}>();
    // public dd:any;

    public visible:boolean = true;
    
    public isSubEmpty:boolean = true;

    public isRTL:boolean = false;

    private dialogIsOpen:boolean;
    public subWordListDownloader = (wordList) => {
      this._ngZone.run(() => {
          this.subText = wordList;
      });
    }

    public subText=[{'text':'','isWord':false}];
    currentPosition = 0; 
    movieLength = 0;

    private isPlaying:boolean = false;

    private videoTitle: string="";
    eventHardwareAccelerationError = function(){
        console.log("event: eventHardwareAccelerationError");
    }
    eventEndReached(){
       console.log('eventEndReached');
       this.position = 0;
       this.save();
       this.clearUI();
       this.routerExtensions.back();
    }
    eventPlaying = function(){
        this.isPlaying = true;
    }
    private eventStopped (){
      this.isPlaying = false; 
    }

    private eventPausd (){
      this.isPlaying = false; 
    }
    eventTimeChanged(){

      this._ngZone.run(() => {
        this.currentPosition = this.vlcAction.getPosition();
      });
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

    eventParsedChanged = function () {
      {
        this._ngZone.run(() => {
          this.movieLength = this.vlcAction.getLength();
        });
      }
  }

    // dropDownLoaded(dd){
    //   this.dd = dd;
    // }


    public label1GuestureHandler= null;
    public label2GuestureHandler = null;
    public guestureHandler = { currentBrightness: 1, brightnessChartVisible: true, currentVolume: 1, volumeChartVisible: true, rightSideguestures: function (lbl) { }, leftSideguestures(lbl) { } };


    guestueresAreLoaded(grd){
      // loads after childs label2Loaded and label1Loaded
      this.guestureHandler = new Guestures(this.vlcAction, this.guestureEventCallbacks);
      this.guestureHandler.rightSideguestures(this.label2GuestureHandler);
      this.guestureHandler.leftSideguestures(this.label1GuestureHandler);

    }
    label2Loaded(lbl){
      this.label2GuestureHandler = lbl;
    }

    label1Loaded(lbl){
      this.label1GuestureHandler = lbl;
    }

    //TODO:change this method name
    onLoaded(vlc) {

      this.videoTitle = fs.File.fromPath(this.path.replace('file://','')).name;

      let play = ()=>{
        timer.setTimeout(() => {
          this.vlcAction.play();
        }, 0);
      }

      this.vlc = vlc;
      this.vlcAction = this.vlc.getVLCAction();
      this.vlcAction.seek(this.position - 5000);
      if (this.position == 0)
      {
        this.dialogIsOpen = false;
        play();
      }

      else {
      let options: ModalDialogOptions = {
		context: { videoTitle: this.videoTitle },
        viewContainerRef: this.viewContainerRef
      };


        if (!this.dialogIsOpen) {
			//prevent to reopen dialog if the user press home and back again to app.
			this.dialogIsOpen = true;
			this.modalService.showModal(ResumeConfirm, options).then((resumeIt: boolean) => {
				this.dialogIsOpen = false;
				if (resumeIt == undefined)
					this.routerExtensions.back();
				else if (resumeIt == true)
					play();
				else {
					this.position = 0;
					play();
				}

			});
        }
      }

      this.subtitle.addSubWordListDownloader(this.subWordListDownloader);
    }
    constructor(private modalService: ModalDialogService,
      private viewContainerRef: ViewContainerRef, private route: ActivatedRoute, private _ngZone: NgZone, private subtitle: Subtitle, private routerExtensions: RouterExtensions) { }

    ngOnDestroy() {
      this.sub.unsubscribe();
    }
    ngOnInit(){
    
     this.statusBarHeight= this.getStatusBarHeight(); 
     this.sub = this.route.params.subscribe(params => {
       this.path = params['path'];
       this.position = parseInt(params['position']);
     });


      application.android.off(application.AndroidApplication.activityPausedEvent)
      application.android.on(application.AndroidApplication.activityPausedEvent,
        function (args: application.AndroidActivityEventData) {
          this.vlc.stopPlayback();
          this.position = this.vlc.lastPosition;
          this.save();
          this.clearUI();
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
          this.clearUI();
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
    private barsAreShowing: boolean =true;
    private isLocked:boolean = false;
    private lockIconVisible:boolean = false;

    private lockScreen(){
      this.isLocked = true;
      this.hideBars();
    }


    private unLockScreen(){
      this.isLocked = false;
      this.lockIconVisible = false;
      this.showBars();
    }

    private showBars(){
          this.barsAreShowing = true;
          frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_VISIBLE );
          let page = frame.topmost().currentPage;
          page.actionBarHidden = false;
          this._ngZone.run(() => {
            this.visible = true;
          });
    }

    private hideBars(){
          this.barsAreShowing = false;
          frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_FULLSCREEN);
          let page = frame.topmost().currentPage;

          page.actionBarHidden = true;

          this._ngZone.run(() => {
            this.visible = false;
          });
    }
    public toggleScreen(){
      if(this.isLocked){
        if(this.lockIconVisible)
          this.lockIconVisible = false;
        else
          this.lockIconVisible = true;
      }

      else if(this.barsAreShowing)
        this.hideBars();

      else if(!this.barsAreShowing)
        this.showBars();
    }

    public save(){
      database.updatePosition(this.path.replace('file://',''), this.position);
    }

    public changeAspectRatio(){
      let currentAspectRatio = this.vlc.getCurrentAspectRatioItem();
      console.log('currentAspectRatio' + currentAspectRatio.name);
      this.currentAspectRatio = (currentAspectRatio.value + 1) % 7;
    }

    // function to prevent calling toggleScreen on tap
    private tapPlayerController(){
    }
    public loaded(){
    }
    public unLoaded(){
    }


     public addSub(subPath: string){

      this.subtitle.loadSubtitle(subPath ,(isRTL:boolean, success:boolean, err:any)=>{
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
      }
    }


    private shouldDismissTracksMenu:boolean = false; 
    private shouldDismissMoreMenu:boolean = false; 

    private tracksMenu: any;
    private moreMenu: any;

    public moreButtonLoaded(moreBtn) {

      let btn = moreBtn._nativeView;

      this.moreMenu = new android.widget.PopupMenu(application.android.foregroundActivity, btn);
      this.moreMenu.getMenu().add("HW ACCELERATION");

      this.moreMenu.setOnMenuItemClickListener(new android.widget.PopupMenu.OnMenuItemClickListener({
        onMenuItemClick: (item) => {
          this.showAccelerationDialog();          
          return false;
        }
      }));

      btn.setOnClickListener(new android.view.View.OnClickListener({
        onClick: () => {
          this.moreMenu.show();
        }
      }));

    }

    
    public tracksBtnLoaded(tracksBtn){
      let btn = tracksBtn._nativeView;

      this.tracksMenu = new android.widget.PopupMenu(application.android.foregroundActivity, btn);
      let menu = this.tracksMenu.getMenu();
      menu.add(0, 0, 0, "Audio Track");
      menu.add(0, 1, 2, "Subtitles").setEnabled(false);
      menu.add(0, 2, 1, "Select Subtitle file");

      this.tracksMenu.setOnMenuItemClickListener(new android.widget.PopupMenu.OnMenuItemClickListener({
        onMenuItemClick: (item) => {
          console.log(item.getItemId());
          console.log(item.getTitle());
          if(item.getItemId() == 0){
            this.showAudioTracksDialog();
            return true;
          }

          else if(item.getItemId() == 2){
            let isPlaying = this.vlcAction.isPlaying();
            this.vlcAction.pause();

            let startObject = fs.File.fromPath(this.path.replace('file://',''));
            let startPath;
            try{
              startPath = startObject.parent.path;
            }catch(e){
              startPath = startObject.path;
            }

            let options: ModalDialogOptions = {
               context: { startPath: startPath },
              viewContainerRef: this.viewContainerRef
            };


            this.modalService.showModal(FilePicker, options).then((res: string) => {
              this.addSub(res);
              if(isPlaying)
                this.vlcAction.play();
            });
            return true;
          }
          

        }
      }));

      btn.setOnClickListener(new android.view.View.OnClickListener({
        onClick: () => {
          this.tracksMenu.show();
        }
      }));

    }

    private showAudioTracksDialog() {
      let isPlaying = this.vlcAction.isPlaying();
      this.vlcAction.pause();
      let audioTracks = this.vlc.getAudioTracks();

      let options: ModalDialogOptions = {
		  context: { audioTracks: audioTracks, currentAudioTrack: this.vlcAction.currentAudioTrack },
		  viewContainerRef: this.viewContainerRef,
      };

      this.modalService.showModal(AudioSelector, options).then((audioTrackId: number) => {
		  if(audioTrackId)
			this.currentAudioTrack = audioTrackId;
		  if(isPlaying)
			this.vlcAction.play();
      });
    }
    private showAccelerationDialog(){
      let isPlaying = this.vlcAction.isPlaying();
      this.vlcAction.pause();

      let options: ModalDialogOptions = {
        viewContainerRef: this.viewContainerRef
      };

      this.modalService.showModal(AccelerationSelector, options).then((hw: number) => {
        if(hw != undefined){
            // this.lockScreen();
            this.vlc.stopPlayback();
            VLCSettings.hardwareAcceleration = hw;
            this.vlcAction.play();
            // this.unLockScreen();
        }
		  console.log(hw);
        if(isPlaying)
            this.vlcAction.play();
      });


    }

    clearUI(){

      if(this.moreMenu)
        this.moreMenu.dismiss();
      if(this.tracksMenu)
        this.tracksMenu.dismiss();
      this.moreMenu = null;
      this.tracksMenu = null;

    }


}
