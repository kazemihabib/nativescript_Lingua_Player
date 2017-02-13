import { Component, OnInit,AfterViewInit,ViewChild,ElementRef } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";
// import { SelectedIndexChangedEventData } from "nativescript-drop-down";
// import dropDown = require("nativescript-drop-down");
import {Dictionary} from "../../services/dictionary.service"

import {DownloadManager} from 'nativescript-downloadmanager'

import {
    FlexboxLayout,
    FlexDirection,
    FlexWrap,
    JustifyContent,
    AlignItems,
    AlignContent,
    AlignSelf
} from "ui/layouts/flexbox-layout";


@Component({
    selector: 'modal-content',
    templateUrl: "dialogs/dictionary_dialog/dictionary_dialog.html",
    styleUrls: [ "dialogs/dictionary_dialog/dictionary_dialog.css"],
})
export class DictionaryDialog implements AfterViewInit {

    private word:string;
    private languages = ["English","Farsi","Arabic","France"];
    // private dictionaries = ['oxford','hfarse','cmabridge','longman','oxford','hfarse','cmabridge','longman','oxford','hfarse','cmabridge','longman','oxford','hfarse','cmabridge','longman'];
    private dictionaries = ['Oxford.png','azin.jpg','cambridge.jpg','longman.png','Oxford.png','azin.jpg','cambridge.jpg','longman.png'];
    // private dictionaries = ['azin.jpg'];

    @ViewChild("webView") webView:any ;
    @ViewChild('text') textView: ElementRef;

    public ngAfterViewInit(){
        if(this.webView.nativeElement.android) { // in IOS android will be undefined
            this.webView.nativeElement.android.getSettings().setBuiltInZoomControls(false);
            //remove focus from textview
            this.webView.nativeElement.focus();
            
        }

    }

    toggle(){
        //remove focus from textview
        this.webView.nativeElement.focus();
    }
    private web1:string;

    constructor(private params: ModalDialogParams,private dictionary:Dictionary) {
        this.word = params.context.word;
        // console.log('this.word',this.word);
        this.web1 = this.dictionary.getMeaning(this.word);
        // console.log(this.web1);

    }

    public onchange(args:any) {
        console.log(`Drop Down selected index changed from ${args.oldIndex} to ${args.newIndex}`);
    }



    private onItemTap(item: any) {
        console.log('57');
        console.log(this.webView);
        // console.log('item is',item);
    }

    private listViewLoadMoreItems(args){
        // console.log('load more');
        // console.log(args);
        // this.dictionaries.push("Oxford.png");
    }

    private download(){
        let dm = new DownloadManager();
        let options = {};
        dm.downloadFile("http://download.thinkbroadband.com/5MB.zip",options, function (result, uri) {
            // result is a boolean, if the download was successful, it will return true
            console.log(result);
            // Uri in file:// format of the downloaded file.
            console.log(uri);
            // unregisterBroadcast is used to unregister the broadcast (For example if you just want to 
            // download a single file).
            dm.unregisterBroadcast();
        })
    }

}

