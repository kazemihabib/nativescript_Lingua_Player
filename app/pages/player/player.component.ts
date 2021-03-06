﻿import { Component, OnInit, NgZone, ViewContainerRef,ViewChild,ElementRef  } from "@angular/core";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular/modal-dialog";
import { FilePicker } from "../../dialogs/file_picker/file_picker_dialog";
import { AccelerationSelector } from "../../dialogs/acceleration_selector/acceleration_selector";
import { AudioSelector } from "../../dialogs/audio_selector/audio_selector";
import { ResumeConfirm } from "../../dialogs/resume_confirm/resume_confirm";
import { chroma, HW, VLCSettings } from "../../components/VLCSettings";
import { DictionaryDialog } from "../../dialogs/dictionary_dialog/dictionary_dialog";
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
import { VLCComponent } from "../../components/vlc.component";
import { ActivatedRoute } from "@angular/router";
import appSettings = require("application-settings");
import { registerElement } from "nativescript-angular/element-registry";
import { RouterExtensions } from "nativescript-angular/router";
import frame = require("ui/frame");
import { Subtitle } from "../../services/subtitle.service";
import { IGuestureEventCallbacks } from "./guesture.interface";
import dialogs = require("ui/dialogs");
import database = require('../../utils/media.database');
import fs = require("file-system");

registerElement("TNSSlider", () => require("nativescript-slider").Slider);

import timer = require("timer")

import { Guestures } from './guestures'

declare var android: any;
declare var com: any;


@Component({
	selector: "player",
	templateUrl: "pages/player/player.component.html",
	styleUrls: ["pages/player/player.component.css"],
	providers: [Subtitle]
})


export class playerPage implements OnInit {

	public vlc;
	public vlcAction;
	private pathSubscription: any;
	public videoPath: string;
	//the position of movie that gotten from db and will use this property to save in db too.( positionInDb = lastpostion and save in db)
	public positionInDb: number = 0;
	public currentAspectRatio = 0;
	public currentAudioTrack = 0;

	public visible: boolean = true;

	public isSubEmpty: boolean = true;

	public isRTL: boolean = false;

	private resumeDialogIsOpen: boolean;

	//property to prevent resume when modal is open and you turn of screen and turn it off
	private modalIsOpen:boolean = false;
	//property that prevent to show resume dialog when activity is just paused
	private activityIsPaused:boolean = false;
	// public subWordListDownloader = (wordList) => {
	// 	this._ngZone.run(() => {
	// 		this.subText = wordList;
	// 	});
	// }

	public subText = [{ 'text': '', 'isWord': false }];
	currentPosition = 0;
	movieLength = 0;

	private isPlaying: boolean = false;

	private videoTitle: string = "";

	private subtitleIsLoading: boolean = false;

 	@ViewChild("playerController") playerController:any ;


	private eventNativeCrashError (){
		console.log("event: eventNativeCrashError");
	}

	private eventHardwareAccelerationError (){
		console.log("event: eventHardwareAccelerationError");
	}
	private eventEndReached() {
		//prevent to hide home components action bar
		timer.clearTimeout(this.barsTimer);
		this.positionInDb = 0;
		this.save();
		this.clearUI();
		this.routerExtensions.back();
	}
	private eventPlaying () {
		timer.clearTimeout(this.barsTimer);
		this.setBarsHideTimer();

		if(this.activityIsPaused)
		{
			timer.setTimeout(()=>{
				this.vlcAction.pause();
				this.activityIsPaused = false;
			},0);
		}
		this._ngZone.run(() => {
			this.isPlaying = true;
		});
	}
	private eventStopped () {
		this._ngZone.run(() => {
			this.isPlaying = false;
		});
	}

	private eventPausd() {
		timer.clearTimeout(this.barsTimer);
		this._ngZone.run(() => {
			this.isPlaying = false;
		});
	}
	private eventTimeChanged() {
		if(!this.activityIsPaused)
			//at the startPlayback instantiate it will return 
			//0 for position and it will show the wrong position for us
			//so it will not sync until activityIsPaused become false
			//it becomes false in eventPlaying
			this.syncPosition();
		this.getSubtitleDialog();
	}

	private syncPosition(){
		this._ngZone.run(() => {
			this.currentPosition = this.vlcAction.getPosition();
		});

	}

    public getPreviousDialogWordList (){
		let subObj = this.subtitle.getPreviousDialogWordList(this.isSubEmpty);
		if(subObj){
			this.isSubEmpty = false;
			this._ngZone.run(() => { this.subText = subObj.wordList; });
		}
	}

    public getNextDialogWordList (){
		let subObj = this.subtitle.getNextDialogWordList(this.isSubEmpty);
		if(subObj){
			this.isSubEmpty = false;
			this._ngZone.run(() => { this.subText = subObj.wordList; });
		}
	}

	private seekToPreviousDialogWordList(){
		//warning
		//TODO
		//consider fast seek that seeks are not  that not seeks to exact position
		//so user press previous button(when it's pause) and it seeks to prev dialog
		//then it plays again and might not continue that dialog (perhaps one or two before that).
		//how to fix it !!! ??? 


		//after user release long touching the (tap) will be fired
		//so the getPreviousDialogWordList will call.
		let subObj = this.subtitle.getPreviousDialogWordList(this.isSubEmpty);
		if(subObj){
			this.vlcAction.seek(subObj.startTime);
			this.syncPosition();
		}
				
	}
	private seekToNextDialogWordList(){
		let subObj = this.subtitle.getNextDialogWordList(this.isSubEmpty);
		if(subObj){
			this.vlcAction.seek(subObj.startTime);
			this.syncPosition();
		}

	}

	private getSubtitleDialog() {
		let wordList = this.subtitle.getDialogWordList(this.currentPosition);

		this.isSubEmpty = wordList.length == 0;

		this._ngZone.run(() => {
			if (!this.isSubEmpty)
				this.subText = wordList;

		});
	}

	private fromUser(args) {
		this.vlcAction.seek(args.newValue);
		this.eventTimeChanged();
	}

	private eventParsedChanged = function () {
		{
			this._ngZone.run(() => {
				this.movieLength = this.vlcAction.getLength();
			});
		}
	}


	public label1GuestureHandler = null;
	public label2GuestureHandler = null;
	public guestureHandler = { currentBrightness: 1, brightnessChartVisible: true, currentVolume: 1, volumeChartVisible: true, rightSideguestures: function (lbl) { }, leftSideguestures(lbl) { } };


	private guestueresAreLoaded(grd) {
		// loads after childs label2Loaded and label1Loaded
		this.guestureHandler = new Guestures(this.vlcAction, this.guestureEventCallbacks,this._ngZone);
		this.guestureHandler.rightSideguestures(this.label2GuestureHandler);
		this.guestureHandler.leftSideguestures(this.label1GuestureHandler);

	}
	private label2Loaded(lbl) {
		this.label2GuestureHandler = lbl;
	}

	private label1Loaded(lbl) {
		this.label1GuestureHandler = lbl;
	}
	private pageLoaded(){
		//to hide the status bar when activity paused and resumed and navigate to this page
		this.hideStatusBar();
		timer.setTimeout(() => {
			//update 
			//I found that if i put it in setTimeOut I can use it here 
			//thie place is better because the bars are not shown 
			//at the background of  resumeDialog and also it doesn't effect ui

			//now at the start the bars will hide
			//so the bars will not shown on the screen at the start it's beautifull 
			//and also user has to tap screen to see them and timeout of hiding 
			//them will set.
			if(this.activityIsPaused && !this.isLocked)
				this.showBars();
            else
				this.hideBarsWithNoAnimation();
		}, 0);
	}


	private VLCLoaded(vlc) {
		this.videoTitle = fs.File.fromPath(this.videoPath.replace('file://', '')).name;

		let play = () => {
			//TODO:
			//as if activityIsPaused is true this function will not called
			//so I think I don't need this modalIsOpen 
			//but I keep it because I will need it soon
			if(!this.modalIsOpen)
				timer.setTimeout(() => {
					this.vlcAction.play();
				}, 0);
		}

		this.vlc = vlc;
		this.vlcAction = this.vlc.getVLCAction();

		if(this.activityIsPaused){
			//we don't need to get data from database,show resume dialog and .. .
			//because acitivy is paused not destroyed and we have them already
			

			//the below paly call is just for preparing surfaceView
			//so I have to play and pause it to prepare it
			//If I don't do it the seek won't work befor first resuming it
			//that's why I don't use the above play method 
			//because it should be played even when modalIsOpen	
			//fix #53
			//actually doing this will not fix it verry well(seek might enable but screen is black event after seek)
			//but for now it's the best method I found
			this.syncPosition();
			return timer.setTimeout(() => {
				this._ngZone.run(() => {
					this.currentPosition = this.positionInDb;
				});
				this.vlcAction.play();
			}, 0);
		}

		this.positionInDb = this.positionInDb > 5000 ? this.positionInDb - 5000 : 0;	
		
		if (this.positionInDb == 0) {
			this.resumeDialogIsOpen = false;
			play();
		}

		else {
			let options: ModalDialogOptions = {
				context: { videoTitle: this.videoTitle },
				viewContainerRef: this.viewContainerRef
			};


			if (!this.resumeDialogIsOpen) {
				//prevent to reopen dialog if the user press home and back again to app.
				this.resumeDialogIsOpen = true;
				this.modalIsOpen = true;
				this.modalService.showModal(ResumeConfirm, options).then((resumeIt: boolean) => {
					this.resumeDialogIsOpen = false;
					this.modalIsOpen = false;
					this.hideStatusBar();
					if (resumeIt == undefined)
						this.routerExtensions.back();
					else if (resumeIt == true)
						play();
					else {
						this.positionInDb = 0;
						play();
					}

				});
			}
		}

		// this.subtitle.addSubWordListDownloader(this.subWordListDownloader);
	}
	constructor(private modalService: ModalDialogService,
		private viewContainerRef: ViewContainerRef, private route: ActivatedRoute, private _ngZone: NgZone, private subtitle: Subtitle, private routerExtensions: RouterExtensions) { }

		private wakeLock;
	ngOnDestroy() {
		this.pathSubscription.unsubscribe();
		this.wakeLock.release();
	}
	ngOnInit() {
		//  this.statusBarHeight= this.getStatusBarHeight(); 
		this.pathSubscription = this.route.params.subscribe(params => {
			this.videoPath = params['path'];
			this.positionInDb = parseInt(params['position']);
		});

        let pm = application.android.context.getSystemService(android.content.Context.POWER_SERVICE);
        this.wakeLock = pm.newWakeLock(android.os.PowerManager.SCREEN_BRIGHT_WAKE_LOCK, "My Tag");
        this.wakeLock.acquire();

		application.android.off(application.AndroidApplication.activityPausedEvent)
		application.android.on(application.AndroidApplication.activityPausedEvent,
			function (args: application.AndroidActivityEventData) {
				this.activityIsPaused = true;
				//do what is need when player is paused (I tried vlcAction.pause() and thought it will below event will be fired 
				//but that not happend so I called it directly )
				this.eventPausd();
				this.vlc.stopPlayback();
				this.positionInDb = this.vlc.lastPosition;
				this.save();
				this.clearUI();
				this.label2GuestureHandler.off('touch', function (args) { });
				this.label1GuestureHandler.off('touch', function (args) { });
			}, this);

		application.android.off(application.AndroidApplication.activityDestroyedEvent);
		application.android.on(application.AndroidApplication.activityDestroyedEvent,
			function (args: application.AndroidActivityEventData) {
				this.vlc.stopPlayback();
				this.positionInDb = this.vlc.lastPosition;
				this.save();
			}, this);

		application.android.off(application.AndroidApplication.activityBackPressedEvent);
		application.android.on(application.AndroidApplication.activityBackPressedEvent,this.prepareGoBack,this);
	}

	private prepareGoBack(){
		//prevent to hide home components action bar
		timer.clearTimeout(this.barsTimer);
		this.vlc.stopPlayback();
		this.positionInDb = this.vlc.lastPosition;
		this.save();
		this.clearUI();

	}

	private navigationButtonBack(){
		this.prepareGoBack();
		this.routerExtensions.back();
	}
	private statusBarHeight = 0;
	private getStatusBarHeight() {
		let result: number = 0;
		let resourceId: number = application.android.context.getResources().getIdentifier("status_bar_height", "dimen", "android");
		if (resourceId > 0) {

			result = application.android.context.getResources().getDimensionPixelSize(resourceId);
		}
		return result;
	}
	private isLocked: boolean = false;
	private lockIconVisible: boolean = false;

	private lockScreen() {
		this.isLocked = true;
		this.hideBars();
	}


	private unLockScreen() {
		this.isLocked = false;
		this.lockIconVisible = false;
		this.showBars();
	}

	private showBars() {
		//when I fix overlay of statusbar on actionbar --> status bar shifts activity down so I disabled showing status bar
		// let show:number =  android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
		// frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(show);

		let page = frame.topmost().currentPage;
   	  	let playerController = this.playerController.nativeElement;
		//If I get the actionbar with childview and try to animate it I will get error I should get in this way
   	  	let actionBar = page.actionBar;


		page.actionBarHidden = false;
		this._ngZone.run(() => {
			this.visible = true;
		});

		actionBar.animate({
				opacity: 1,
				duration: 250
		});

		playerController.animate({
				opacity: 1,
				duration: 250
		});

	}

	private hideStatusBar(){
		frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_FULLSCREEN);
	}
	private hideBarsWithNoAnimation(){
		this.hideStatusBar();
		let page = frame.topmost().currentPage;
   	  	let actionBar = page.actionBar;
			 
		page.actionBarHidden = true;

		this._ngZone.run(() => {
			this.visible = false;
		});

	}
	private hideBars() {
		this.hideStatusBar();
		let page = frame.topmost().currentPage;
   	  	let playerController = this.playerController.nativeElement;
   	  	let actionBar = page.actionBar;
			 
		actionBar.animate({
				opacity: 0,
				duration: 250
		}).then(()=>{
			page.actionBarHidden = true;
		} )


		playerController.animate({
				opacity: 0,
				duration: 250
		}).then(()=>{
			this._ngZone.run(() => {
				this.visible = false;
			});
		} )



	}
	
	private doubleTapScreen(args){
        if(this.tapToTogglePlayer)
			if(this.isPlaying)
				this.vlcAction.pause();
            else	
				this.vlcAction.play();

	}
	
	private lockIconTimer;
	private barsTimer;

	public toggleScreen() {
		//If I don't clear it and  toggle screen multiple times it might
		//it might be hide sooner than 2 seconds because of previous lock icons
		timer.clearTimeout(this.lockIconTimer);
		timer.clearTimeout(this.barsTimer);
		if (this.isLocked) {
			//to close it when user opens it by pulling down status bar
			this.hideStatusBar();	
			if (this.lockIconVisible){
				this.lockIconVisible = false;
			}
			else{
				this.lockIconVisible = true;
				this.lockIconTimer = timer.setTimeout(()=>{
					this.lockIconVisible = false;
				},this.timeOutTime)
			}
		}

		else if (this.visible)
			this.hideBars();

		else if (!this.visible){
			this.showBars();
			if(this.isPlaying)
				this.setBarsHideTimer();
		}

	}

	private setBarsHideTimer() {
		this.barsTimer = timer.setTimeout(() => {
			this.hideBars();
		}, this.timeOutTime)

	}

	private save() {
		database.updatePosition(this.videoPath.replace('file://', ''), this.positionInDb);
	}

	private currentAspectRatioName = null;
	private aspectRatioTimer = null;
	private changeAspectRatio() {
		timer.clearTimeout(this.barsTimer);
		this.setBarsHideTimer();
		timer.clearTimeout(this.aspectRatioTimer);
		let currentAspectRatio = this.vlc.getCurrentAspectRatioItem();
		this.currentAspectRatio = (currentAspectRatio.value + 1) % 7;
		timer.setTimeout(()=>{
			currentAspectRatio = this.vlc.getCurrentAspectRatioItem();
			this.currentAspectRatioName = currentAspectRatio.name;
			this.aspectRatioTimer = timer.setTimeout(()=>{
				this.currentAspectRatioName = null; 
			},2000);
		},0);

	}

	// function to prevent calling toggleScreen on tap
	private tapPlayerController() {
		timer.clearTimeout(this.barsTimer);
		this.setBarsHideTimer();
	}

	//To chcek should I show show < and > below subtitle.
	private subtitleIsLoaded:boolean = false;
	public addSub(subPath: string) {

		this._ngZone.run(() => {
			this.subtitleIsLoading = true;
		});
		this.subtitle.loadSubtitle(subPath, (isRTL: boolean, success: boolean, err: any) => {
			console.log('sub Load success: ', success);
			console.log('sub err: ', err)
			this.isRTL = isRTL;
			this._ngZone.run(() => {
				this.subtitleIsLoading = false;
				this.subtitleIsLoaded = true;
			});
			//to show the subtitle dialog if it's paused and user loads
			//subtitle --> shows if there is dialog there and also
			//enables next and previous with setting index in subtitle.service
			this.getSubtitleDialog();
		});
	}

	public showDictionary(item: { 'text': '', 'isWord': false, 'isNotWord': false, 'isLine': false }) {

		let isPlaying = this.vlcAction.isPlaying();
		this.vlcAction.pause();

		let options: ModalDialogOptions = {
			context: { word:item.text },
			viewContainerRef: this.viewContainerRef
		};

		this.modalIsOpen = true;
		this.modalService.showModal(DictionaryDialog, options).then((audioTrackId: number) => {
			this.modalIsOpen = false;
			this.hideStatusBar();
			if (isPlaying)
				this.vlcAction.play();
		})

	}

	public guestureEventCallbacks: IGuestureEventCallbacks = {
		seekEventFired: () => {
			this.eventTimeChanged();
		}
	}


	private shouldDismissTracksMenu: boolean = false;

	private tracksMenu: any;

	private tracksBtnLoaded(tracksBtn) {
		let btn = tracksBtn._nativeView;
		let isSelected:boolean = false;
		this.tracksMenu = new android.widget.PopupMenu(application.android.foregroundActivity, btn);
		let menu = this.tracksMenu.getMenu();
		menu.add(0, 0, 1, "Subtitles").setEnabled(false);
		menu.add(0, 1, 0, "Select Subtitle file");
		menu.add(0, 2, 2, "Settings");

		this.tracksMenu.setOnMenuItemClickListener(new android.widget.PopupMenu.OnMenuItemClickListener({
			onMenuItemClick: (item) => {
				isSelected = true;
				if (item.getItemId() == 0) {
					
					return true;
				}

				else if (item.getItemId() == 1) {
					this._ngZone.run(() => {
						this.showFilePickerDialog();
					});
					return true;
				}

				if (item.getItemId() == 2) {
					
					return true;
				}
			}

		}));

		this.tracksMenu.setOnDismissListener(new android.widget.PopupMenu.OnDismissListener({
			onDismiss:(menu)=>{
				//opening menu automatically shows status bar 
				//and dialog is also shows status bar so If I don't check
				//if menu item is selected so it will hide status bar and dialog shows again
				//so there is push down and push up happens for activity 
				if(!isSelected)
					this.hideStatusBar();
				isSelected=false;
				if(this.isPlaying)
					this.setBarsHideTimer();
			} 	
		}));

		btn.setOnClickListener(new android.view.View.OnClickListener({
			onClick: () => {
				this.tracksMenu.show();
				timer.clearTimeout(this.barsTimer);
			}
		}));

	}

	private overflowBtn;
	private overflowButtonLoaded(overflowBtn){
		let btn = overflowBtn._nativeView;
		let isSelected:boolean = false;
		this.overflowBtn = new android.widget.PopupMenu(application.android.foregroundActivity, btn);
		let menu = this.overflowBtn.getMenu();

		menu.add(0, 0, 0, "Settings");
		menu.add(0, 1, 1, "About");

		this.overflowBtn.setOnMenuItemClickListener(new android.widget.PopupMenu.OnMenuItemClickListener({
			onMenuItemClick: (item) => {
				isSelected = true;
				if (item.getItemId() == 0) {
					console.log('Settings');
					
					return true;
				}

				else if (item.getItemId() == 1) {
					console.log('About')
					return true;
				}

				if (item.getItemId() == 2) {
					
					return true;
				}
			}

		}));

		this.overflowBtn.setOnDismissListener(new android.widget.PopupMenu.OnDismissListener({
			onDismiss:(menu)=>{
				//opening menu automatically shows status bar 
				//and dialog is also shows status bar so If I don't check
				//if menu item is selected so it will hide status bar and dialog shows again
				//so there is push down and push up happens for activity 
				if(!isSelected)
					this.hideStatusBar();
				isSelected=false;
				if(this.isPlaying)
					this.setBarsHideTimer();
			} 	
		}));

		btn.setOnClickListener(new android.view.View.OnClickListener({
			onClick: () => {
				this.overflowBtn.show();
				timer.clearTimeout(this.barsTimer);
			}
		}));
	}

	private showFilePickerDialog(){
					let isPlaying = this.vlcAction.isPlaying();
					this.vlcAction.pause();

					let startObject = fs.File.fromPath(this.videoPath.replace('file://', ''));
					let startPath;
					try {
						startPath = startObject.parent.path;
					} catch (e) {
						startPath = "/";
					}

					let options: ModalDialogOptions = {
						context: { startPath: startPath,extensions:['srt'],ignoreExtensions:[]},
						viewContainerRef: this.viewContainerRef
					};


					this.modalIsOpen = true;
					this.modalService.showModal(FilePicker, options).then((res: string) => {
						this.hideStatusBar();
						this.modalIsOpen = false;
						if(res)
							this.addSub(res);
						if (isPlaying)
							this.vlcAction.play();
					});

	}
	private showAudioTracksDialog() {
		let isPlaying = this.vlcAction.isPlaying();
		this.vlcAction.pause();
		let audioTracks = this.vlc.getAudioTracks();

		let options: ModalDialogOptions = {
			context: { audioTracks: audioTracks, currentAudioTrack: this.vlcAction.currentAudioTrack },
			viewContainerRef: this.viewContainerRef,
		};

		this.modalIsOpen = true;
		this.modalService.showModal(AudioSelector, options).then((audioTrackId: number) => {
			this.hideStatusBar();
			this.modalIsOpen = false;
			if (audioTrackId)
				this.currentAudioTrack = audioTrackId;
			if (isPlaying)
				this.vlcAction.play();
		});
	}
	private showAccelerationDialog() {
		let isPlaying = this.vlcAction.isPlaying();
		this.vlcAction.pause();

		let options: ModalDialogOptions = {
			viewContainerRef: this.viewContainerRef
		};

		this.modalIsOpen = true;
		this.modalService.showModal(AccelerationSelector, options).then((hw: number) => {
			this.hideStatusBar();
			this.modalIsOpen = false;
			if (hw != undefined) {
				// this.lockScreen();
				//vlc.component saves the last position before stopPlayback and when plays again in parsed event seeks the player. 
				this.vlc.stopPlayback();
				VLCSettings.hardwareAcceleration = hw;
				// this.unLockScreen();
			}
			if (isPlaying)
				this.vlcAction.play();
		});


	}

	clearUI() {

		if (this.tracksMenu)
			this.tracksMenu.dismiss();

		if (this.overflowBtn)
			this.overflowBtn.dismiss();

        this.overflowBtn = null;
		this.tracksMenu = null;

	}


/*App settings*/
	/*subtitle setting*/
		private subtitleMarginBottom:number = 30;
		//use rgb color picker with out alpha parameter
		private subtitleColor:string = "rgba(255, 255, 255, 1)";
		//use rgb color selector for this with alpha for opacity of background
		private subtitleBackgroundColor:string ="rgba(0, 0, 0, 0.09)";
		//use slider for this
		private subtitleSize:number = 30;
		//use slider for this
		private spaceBetweenWords:number = 5;

	/*player settings*/
		//should pause and resume with tap
		private tapToTogglePlayer:boolean = true;
		//ms to hide bars and lock icon
		private timeOutTime:number = 2000;

}
