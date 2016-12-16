import { Component, OnInit } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";
import fs = require("file-system");
import platformModule = require("platform");

import {
    FlexboxLayout,
    FlexDirection,
    FlexWrap,
    JustifyContent,
    AlignItems,
    AlignContent,
    AlignSelf
} from "ui/layouts/flexbox-layout";

declare var java: any;

@Component({
    selector: 'modal-content',
    templateUrl: "dialogs/dialog.html",
})
export class DialogContent {

    public listOfFilesAndFolders: fsData[] = [];
    public currentDirectory: string = '/sdcard';
    public prompt: 'choose subtitle';
    constructor(private params: ModalDialogParams) {
    }

    private onItemTap(args) {
        let item = this.listOfFilesAndFolders[args.index];
        let path = item.path;

        if (!item.isFile) {
            this.refreshList(path);
        }

        else
            this.params.closeCallback(item.path);


    }

    public ngOnInit() {
        this.refreshList(this.currentDirectory);
    }

    private back() {

        let file = new java.io.File(this.currentDirectory);

        if (file.getParent() != null) {
            let parent = file.getParent();
            this.refreshList(parent);
        }

    }

    private refreshList(path: string) {
        this.currentDirectory = path;
        this.listOfFilesAndFolders = [];
        let filesAndFolders = fs.Folder.fromPath(path);

        filesAndFolders.eachEntity((entity) => {
            let file = new java.io.File(entity.path);
            if (!file.canRead())
                return true;

            let ent = new fsData();

            ent.name = entity.name;
            ent.path = entity.path;

            if (file.isDirectory())
                ent.isFile = false;
            else
                ent.isFile = true;

            this.listOfFilesAndFolders.push(ent);

            return true;
        });
    }

}

class fsData {
    public name: string;
    public isFile: boolean;
    public path: string;

}