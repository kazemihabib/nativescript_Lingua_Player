import { Component, OnInit } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";
import {HW,VLCSettings} from "../../components/VLCSettings";

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
    templateUrl: "dialogs/acceleration_selector/acceleration_selector.html",
    styleUrls: [ "dialogs/acceleration_selector/acceleration_selector.css"]
})
export class AccelerationSelector {

    selectedAcceleration:number = VLCSettings.hardwareAcceleration;
    sw = new AccelerationItem(HW.HW_ACCELERATION_DISABLED, "SW");
    // hwAutomatic = new AccelerationItem(HW.HW_ACCELERATION_AUTOMATIC, "HW ACCELERATION AUTOMATIC");
    hwFull = new AccelerationItem(HW.HW_ACCELERATION_FULL, "HW");
    // hwDecoding = new AccelerationItem(HW.HW_ACCELERATION_DECODING, "HW DECODING");

    items = [ this.sw ,  this.hwFull ]

    constructor(private params: ModalDialogParams) {
        //  this.startPath = params.context.startPath;
    }

    private onItemTap(item:AccelerationItem) {
        if(item.acceleration == this.selectedAcceleration){
            this.params.closeCallback(undefined);
        }
        else
            this.params.closeCallback(item.acceleration);
    }

}

class AccelerationItem{
    acceleration:HW;
    text:string;

    constructor(acceleration,text){
        this.acceleration = acceleration;
        this.text = text;
    }
}
