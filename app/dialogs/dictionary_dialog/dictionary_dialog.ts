import { Component, OnInit } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";

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
    styleUrls: [ "dialogs/dictionary_dialog/dictionary_dialog.css"]
})
export class DictionaryDialog  {


    constructor(private params: ModalDialogParams) {
        // let audioTracks = params.context.audioTracks;
    }



    private onItemTap(item: AudioTrack) {
    }

}

