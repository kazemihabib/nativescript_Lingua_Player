import { Component, OnInit, NgZone, ViewContainerRef } from "@angular/core";
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

// registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown);
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
		this.isPlaying = true;
	}
	private eventStopped () {
		this.isPlaying = false;
	}

	private eventPausd() {
		this.isPlaying = false;
	}
	private eventTimeChanged() {

		this._ngZone.run(() => {
			this.currentPosition = this.vlcAction.getPosition();
		});
		this.getSubtitleDialog();
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
		this.guestureHandler = new Guestures(this.vlcAction, this.guestureEventCallbacks);
		this.guestureHandler.rightSideguestures(this.label2GuestureHandler);
		this.guestureHandler.leftSideguestures(this.label1GuestureHandler);

	}
	private label2Loaded(lbl) {
		this.label2GuestureHandler = lbl;
	}

	private label1Loaded(lbl) {
		this.label1GuestureHandler = lbl;
	}

	private VLCLoaded(vlc) {

		this.videoTitle = fs.File.fromPath(this.videoPath.replace('file://', '')).name;

		let play = () => {
			timer.setTimeout(() => {
				this.vlcAction.play();
			}, 0);
		}

		this.vlc = vlc;
		this.vlcAction = this.vlc.getVLCAction();

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
				this.modalService.showModal(ResumeConfirm, options).then((resumeIt: boolean) => {
					this.resumeDialogIsOpen = false;
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

	ngOnDestroy() {
		this.pathSubscription.unsubscribe();
	}
	ngOnInit() {
		//  this.statusBarHeight= this.getStatusBarHeight(); 
		this.pathSubscription = this.route.params.subscribe(params => {
			this.videoPath = params['path'];
			this.positionInDb = parseInt(params['position']);
		});


		application.android.off(application.AndroidApplication.activityPausedEvent)
		application.android.on(application.AndroidApplication.activityPausedEvent,
			function (args: application.AndroidActivityEventData) {
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
		application.android.on(application.AndroidApplication.activityBackPressedEvent,
			function (args) {
				this.vlc.stopPlayback();
				this.positionInDb = this.vlc.lastPosition;
				this.save();
				this.clearUI();
			}, this);
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
		frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_VISIBLE);
		let page = frame.topmost().currentPage;
		page.actionBarHidden = false;
		this._ngZone.run(() => {
			this.visible = true;
		});
	}

	private hideBars() {
		frame.topmost().android.activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_FULLSCREEN);
		let page = frame.topmost().currentPage;

		page.actionBarHidden = true;

		this._ngZone.run(() => {
			this.visible = false;
		});
	}
	public toggleScreen() {
		if (this.isLocked) {
			if (this.lockIconVisible)
				this.lockIconVisible = false;
			else
				this.lockIconVisible = true;
		}

		else if (this.visible)
			this.hideBars();

		else if (!this.visible)
			this.showBars();
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


	public addSub(subPath: string) {

		this.subtitle.loadSubtitle(subPath, (isRTL: boolean, success: boolean, err: any) => {
			console.log('sub Load success: ', success);
			console.log('sub err: ', err)
			this.isRTL = isRTL;
		});
	}

	public showDictionary(item: { 'text': '', 'isWord': false, 'isNotWord': false, 'isLine': false }) {

		let isPlaying = this.vlcAction.isPlaying();
		this.vlcAction.pause();

		let options: ModalDialogOptions = {
			context: { item: item },
			viewContainerRef: this.viewContainerRef
		};

		this.modalService.showModal(DictionaryDialog, options).then((audioTrackId: number) => {
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

		this.moreMenu = new android.widget.PopupMenu(application.android.foregroundActivity, btn);
		this.moreMenu.getMenu().add("decoder");

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


	private tracksBtnLoaded(tracksBtn) {
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
				if (item.getItemId() == 0) {
					this.showAudioTracksDialog();
					return true;
				}

				else if (item.getItemId() == 2) {
					let isPlaying = this.vlcAction.isPlaying();
					this.vlcAction.pause();

					let startObject = fs.File.fromPath(this.videoPath.replace('file://', ''));
					let startPath;
					try {
						startPath = startObject.parent.path;
					} catch (e) {
						startPath = startObject.path;
					}

					let options: ModalDialogOptions = {
						context: { startPath: startPath,extensions:['srt'],ignoreExtensions:[]},
						viewContainerRef: this.viewContainerRef
					};


					this.modalService.showModal(FilePicker, options).then((res: string) => {
						this.addSub(res);
						if (isPlaying)
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

		this.modalService.showModal(AccelerationSelector, options).then((hw: number) => {
			if (hw != undefined) {
				// this.lockScreen();
				//vlc.component saves the last position before stopPlayback and when plays again in parsed event seeks the player. 
				this.vlc.stopPlayback();
				VLCSettings.hardwareAcceleration = hw;
				this.vlcAction.play();
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


}
