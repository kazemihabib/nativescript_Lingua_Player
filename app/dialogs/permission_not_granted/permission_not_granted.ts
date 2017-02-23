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
    templateUrl: "dialogs/permission_not_granted/permission_not_granted.html",
    styleUrls: ["dialogs/permission_not_granted/permission_not_granted.css"]
})
export class PermissionNotGranted{

    private title:string = "Allow myPlayer to access mediaFiles";
    private message:string = "myPlayer needs storage access permission to scan and play media files"; 
    constructor(private params: ModalDialogParams) { }

    private ok() {
        this.params.closeCallback();
    }


}