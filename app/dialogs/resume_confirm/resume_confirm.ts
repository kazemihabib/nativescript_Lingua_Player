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
    templateUrl: "dialogs/resume_confirm/resume_confirm.html",
    styleUrls: ["dialogs/resume_confirm/resume_confirm.css"]
})
export class ResumeConfirm{

    private videoTitle:string;
    constructor(private params: ModalDialogParams) {
         this.videoTitle = params.context.videoTitle;
    }


    private onItemTap(selection: boolean) {
        this.params.closeCallback(selection);
    }

}