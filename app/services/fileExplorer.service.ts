//If path is subPaht of another one app should not allow to add it and say it's subPath of another one
import { Injectable } from '@angular/core';
import application = require("application");

import { Observable as RxObservable } from 'rxjs/Observable';

declare var android:any;

export class FileExplorer{
    
    //defaults
    private defaultExtensions:string[]=[
        'mkv','mp4'
    ]

    private defaultIncludedPaths:string[]=[
        '/habib/folder1',
        '/habib/folder1/folder2',
        '/habib/folder2/folder3'
    ]

    private defaultExcludedPaths:string[]=[
       '/habib/folder1/shouldExclude' 
    ]

    //user
    private extensions:string[]=[
    ]

    private includedPaths:string[]=[
    ]

    private excludedPaths:string[]=[
    ]


    public refresh(){
        
    }

    constructor(){
        this.extensions = this.defaultExtensions.slice();
        this.includedPaths = this.defaultIncludedPaths.slice();
        this.excludedPaths = this.defaultExcludedPaths.slice();

        //getFrom database


    }
    public includePath(path){
        if(this.includedPaths.indexOf(path.trim()) < 0)
            this.includedPaths.push(path);
        //database
    }
    public exludePath(path){
        if(this.excludedPaths.indexOf(path.trim()) < 0)
            this.excludedPaths.push(path);
        
        //database
    }

    public addExtension(extension:string){
         if(this.extensions.indexOf(extension.toLowerCase().trim()) < 0)
            this.excludedPaths.push(extension.toLowerCase().trim());

        //database
    }
    

    
    public explore(){
        
        
        let paths:string[]=new Array<string>();
        let MediaStore =  android.provider.MediaStore;
        let Uri = android.net.Uri;
        let Cursor = android.content.Context;
        
        let uri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
        let projection = [MediaStore.Video.VideoColumns.DATA];
        let c = application.android.context.getContentResolver().query(uri, projection, null,null , null);

        return RxObservable.create(subscriber => {
        
            if (c != null) {
                let temp;
                while (temp = c.moveToNext()) {
                    let path:string = c.getString(0); // give path
                    paths.push(path);
                    subscriber.next(paths);
                }
                c.close();
            }

        });

    }

}