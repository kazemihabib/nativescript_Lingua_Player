import { Injectable } from '@angular/core';
import {Tokenizer} from "../utils/tokenizer";
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

        let data:ISubWorker.ISubWorkerRequest;
        data = {'function':method , 'path':path , 'encoding':encoding };
        this.worker.postMessage(data);
    }
    constructor(){
        this.worker = new Worker('../workers/subtitle.worker');

    }

    
    public loadSubtitle(path:string, callback:(isRTL:boolean, success:boolean, err:any)=>any, encoding?:string ){
        this.myPostMessage(ISubWorker.functions.loadSubtitle , path , encoding , undefined);

        this.worker.onmessage = (msg)=>{
            let response:ISubWorker.ISubWorkerResponse = msg.data;

            if(ISubWorker.functions.loadSubtitle == response.function){
                this.subData = response.subData;
                callback(response.isRTL, response.success, response.error);
                
            }

        }
    }

    public detectEncoding(path:string){
        this.myPostMessage(ISubWorker.functions.detectEncoding , path , undefined , undefined);
        this.worker.onmessage = (msg)=>{
            let response:ISubWorker.ISubWorkerResponse = msg.data;

            if (ISubWorker.functions.detectEncoding == response.function){
                console.log('encodings ', response.encodings);
            }
            
        }
    }

    public getDialogWordList (time:number):any{
        let index = _.sortedIndex(this.subData, {startTime: time}, function(sub){return sub.startTime});
        index--;
        if(index<0)
            //return empty wordList
            return [];
        
        let obj:any = this.subData[index];

        if(time > obj.endTime)
            //return empty wordList
            return [];
        return obj.wordList;
    } 

    public addSubWordListDownloader(downloader:Function){
       this.subWordListDownloader = downloader;                
    }

}
