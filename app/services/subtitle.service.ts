import { Injectable } from '@angular/core';
import {Tokenizer} from "./tokenizer";
let _ = require('underscore');
let encodingDetector = require('charset-detector');
let srtParser = require('subtitles-parser');
import * as fs from 'file-system';
import * as ISubWorker from '../workers/subworker.interface';

@Injectable()
export class Subtitle{
    private subData:Array<Object>= []; 
    private encoding:string; 

    private worker:any;
    public subWordListDownloader:Function;
    private myPostMessage(method:ISubWorker.functions,path:string,encoding:string,time:number){
        // console.log('service myPostMessage ');

        let data:ISubWorker.ISubWorkerRequest;
        data = {'function':method , 'path':path , 'encoding':encoding , 'time':time};
        this.worker.postMessage(data);
    }
    constructor(){
        this.worker = new Worker('../workers/subtitle.worker');
        this.worker.onmessage = (msg)=>{
            let response:ISubWorker.ISubWorkerResponse = msg.data;

            if(ISubWorker.functions.loadSubtitle == response.function){
                console.log('success: ',response.success);                
                console.log('error: ',response.error);
            }

            else if (ISubWorker.functions.detectEncoding == response.function){
                console.log('encodings ', response.encodings);
            }

            else if(ISubWorker.functions.getDialogWordList == response.function){
                //  console.log('wordList: ',response.dialogWordList);
                 this.subWordListDownloader(response.dialogWordList);
            }
            
        }

    }

    
    public loadSubtitle(path:string,encoding?:string){
        this.myPostMessage(ISubWorker.functions.loadSubtitle , path , encoding , undefined);
    }

    public detectEncoding(path:string){
        this.myPostMessage(ISubWorker.functions.detectEncoding , path , undefined , undefined);
    }
    public getDialogWordList (time:number):any{
        // console.log('service: ','getDialogWordList');
        this.myPostMessage(ISubWorker.functions.getDialogWordList , undefined , undefined , time);
    } 

    public addSubWordListDownloader(downloader:Function){
       this.subWordListDownloader = downloader;                
    }

}
