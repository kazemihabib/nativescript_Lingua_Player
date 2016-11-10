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

        let data:ISubWorker.ISubWorkerRequest;
        data = {'function':method , 'path':path , 'encoding':encoding };
        this.worker.postMessage(data);
    }
    constructor(){
        this.worker = new Worker('../workers/subtitle.worker');
        this.worker.onmessage = (msg)=>{
            let response:ISubWorker.ISubWorkerResponse = msg.data;

            if(ISubWorker.functions.loadSubtitle == response.function){
                this.subData = response.subData;
                console.log('success: ',response.success);                
                console.dump(response.error);
            }

            else if (ISubWorker.functions.detectEncoding == response.function){
                console.log('encodings ', response.encodings);
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
