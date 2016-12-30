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
    templateUrl: "dialogs/audio_selector/audio_selector.html",
    styleUrls: [ "dialogs/audio_selector/audio_selector.css"]
})
export class AudioSelector {

    private selectedAudioTrack: number;
    private audioTracks;
    items = [];

    constructor(private params: ModalDialogParams) {
        let audioTracks = params.context.audioTracks;
        this.selectedAudioTrack = params.context.currentAudioTrack;
        audioTracks.forEach(
            (element, index, array) => {
                this.items.push(new AudioTrack(element.id, element.name))
            })
    }



    private onItemTap(item: AudioTrack) {
        this.selectedAudioTrack = item.id;
        this.params.closeCallback(item.id);
    }

}

class AudioTrack{
    id: number;
    name: string;

    constructor(id,name) {
        this.id = id;
        this.name = name;
    }
}
