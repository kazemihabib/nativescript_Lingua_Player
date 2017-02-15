import { Component, OnInit, NgZone, ViewContainerRef,ViewChild,ElementRef  } from "@angular/core";
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
		console.log('eventEndReached');
		this.positionInDb = 0;
		this.save();
		this.clearUI();
		this.routerExtensions.back();
	}
	private eventPlaying () {
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
		this._ngZone.run(() => {
			this.isPlaying = false;
		});
	}
	private eventTimeChanged() {
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
			//warning
			//TODO
			//consider fast seek that seeks are not  that not seeks to exact position
			//so user press previous button(when it's pause) and it seeks to prev dialog
			//then it plays again and might not continue that dialog (perhaps one or two before that).
			//how to fix it !!! ??? 
			this.isSubEmpty = false;
			this.vlcAction.seek(subObj.startTime);
			this._ngZone.run(() => { this.subText = subObj.wordList; });
			this.syncPosition();
		}
	}

    public getNextDialogWordList (){
		let subObj = this.subtitle.getNextDialogWordList(this.isSubEmpty);
		if(subObj){
			this.isSubEmpty = false;
			this.vlcAction.seek(subObj.startTime);
			this._ngZone.run(() => { this.subText = subObj.wordList; });
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

	}
	private VLCLoaded(vlc) {
		this.videoTitle = fs.File.fromPath(this.videoPath.replace('file://', '')).name;

		let play = () => {
			if(!this.modalIsOpen)
				timer.setTimeout(() => {
					this.vlcAction.play();
				}, 0);
		}

		this.vlc = vlc;
		this.vlcAction = this.vlc.getVLCAction();

		if(this.activityIsPaused)
			//we don't need to get data from database,show resume dialog and .. .
			//because acitivy is paused not destroyed and we have them already
			return;

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
	public toggleScreen() {
		if (this.isLocked) {
			this.hideStatusBar();	
			if (this.lockIconVisible)
				this.lockIconVisible = false;
			else
				this.lockIconVisible = true;
		}

		else if (this.visible)
			this.hideBars();

		else if (!this.visible)
			this.showBars();

        if(this.tapToTogglePlayer)
			if(this.isPlaying)
				this.vlcAction.pause();
            else	
				this.vlcAction.play();
	}

	private save() {
		database.updatePosition(this.videoPath.replace('file://', ''), this.positionInDb);
	}

	private changeAspectRatio() {
		let currentAspectRatio = this.vlc.getCurrentAspectRatioItem();
		console.log('currentAspectRatio' + currentAspectRatio.name);
		this.currentAspectRatio = (currentAspectRatio.value + 1) % 7;
	}

	// function to prevent calling toggleScreen on tap
	private tapPlayerController() {
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
			});
			this.subtitleIsLoaded = true;
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
			console.log('seekEventFired');
		}
	}


	private shouldDismissTracksMenu: boolean = false;
	private shouldDismissMoreMenu: boolean = false;

	private tracksMenu: any;
	private moreMenu: any;

	private moreButtonLoaded(moreBtn) {

		let btn = moreBtn._nativeView;
		let isSelected:boolean = false;

		this.moreMenu = new android.widget.PopupMenu(application.android.foregroundActivity, btn);
		this.moreMenu.getMenu().add("decoder");

		this.moreMenu.setOnMenuItemClickListener(new android.widget.PopupMenu.OnMenuItemClickListener({
			onMenuItemClick: (item) => {
				isSelected = true;
				this._ngZone.run(() => {
					this.showAccelerationDialog();
				});
				return false;
			}
		}));

		this.moreMenu.setOnDismissListener(new android.widget.PopupMenu.OnDismissListener({
			onDismiss:(menu)=>{
				//opening menu automatically shows status bar 
				//and dialog is also shows status bar so If I don't check
				//if menu item is selected so it will hide status bar and dialog shows again
				//so there is push down and push up happens for activity 
				if(!isSelected)
					this.hideStatusBar();
				isSelected=false;
			} 	
		}));

		btn.setOnClickListener(new android.view.View.OnClickListener({
			onClick: () => {
				this.moreMenu.show();
			}
		}));

	}


	private tracksBtnLoaded(tracksBtn) {
		let btn = tracksBtn._nativeView;
		let isSelected:boolean = false;
		this.tracksMenu = new android.widget.PopupMenu(application.android.foregroundActivity, btn);
		let menu = this.tracksMenu.getMenu();
		menu.add(0, 0, 0, "Audio Track");
		menu.add(0, 1, 2, "Subtitles").setEnabled(false);
		menu.add(0, 2, 1, "Select Subtitle file");

		this.tracksMenu.setOnMenuItemClickListener(new android.widget.PopupMenu.OnMenuItemClickListener({
			onMenuItemClick: (item) => {
				isSelected = true;
				if (item.getItemId() == 0) {
					
					this._ngZone.run(() => {
						this.showAudioTracksDialog();
					});
					return true;
				}

				else if (item.getItemId() == 2) {
					this._ngZone.run(() => {
						this.showFilePickerDialog();
					});
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
			} 	
		}));

		btn.setOnClickListener(new android.view.View.OnClickListener({
			onClick: () => {
				this.tracksMenu.show();
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

		if (this.moreMenu)
			this.moreMenu.dismiss();
		if (this.tracksMenu)
			this.tracksMenu.dismiss();
		this.moreMenu = null;
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
	  		private tapToTogglePlayer:boolean = true;

}
