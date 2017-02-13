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
    templateUrl: "dialogs/not_found/not_found.html",
    styleUrls: ["dialogs/not_found/not_found.css"]
})
export class NotFound{

    private videoTitle:string;
    constructor(private params: ModalDialogParams) {
         this.videoTitle = params.context.videoTitle;
    }

}