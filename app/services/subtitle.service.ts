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
    private lastUsedPathForLoading:string;
    private lastUsedPathForDetectEncoding:string;

    private worker:any;
    private sendToWorker(method:ISubWorker.functions,path:string,encoding:string){

        let data:ISubWorker.ISubWorkerRequest;
        data = {'function':method , 'path':path , 'encoding':encoding };
        this.worker.postMessage(data);
    }
    constructor(){
        this.worker = new Worker('../workers/subtitle.worker');

    }

    
    public loadSubtitle(path:string, callback:(isRTL:boolean, success:boolean, err:any)=>any, encoding?:string ){
        this.sendToWorker(ISubWorker.functions.loadSubtitle , path , encoding);

        this.worker.onmessage = (msg)=>{
            let response:ISubWorker.ISubWorkerResponse = msg.data;

            if(ISubWorker.functions.loadSubtitle == response.function){
                // index should be -1 when load subtitle because subtitle file can change
                this.index = -1;
                if(response.pathAsId == this.lastUsedPathForLoading){
                    this.subData = response.subData;
                    callback(response.isRTL, response.success, response.error);
                }
                
            }

        }
    }

    public detectEncoding(path:string){
        this.sendToWorker(ISubWorker.functions.detectEncoding , path , undefined );
        this.worker.onmessage = (msg)=>{
            let response:ISubWorker.ISubWorkerResponse = msg.data;

            if (ISubWorker.functions.detectEncoding == response.function){
                if(response.pathAsId == this.lastUsedPathForDetectEncoding){
                    console.log('encodings ', response.encodings);
                }
            }
            
        }
    }

    private index:number;
    public getDialogWordList (time:number):any{
        this.index = _.sortedIndex(this.subData, {startTime: time}, function(sub){return sub.startTime});
        this.index--;
        if(this.index<0)
            //return empty wordList
            return [];
        
        let obj:any = this.subData[this.index];

        if(time > obj.endTime)
            //return empty wordList
            return [];
        return obj.wordList;
    } 
    public getPreviousDialogWordList (isCurrentSubEmpty:boolean){
        let obj:any;
        if(this.index > 0)
            if(isCurrentSubEmpty) 
                obj = this.subData[this.index];
            else 
                obj = this.subData[--this.index];

            return obj;
    }

    public getNextDialogWordList (isCurrentSubEmpty:boolean){
        let obj:any;
        if(this.index < this.subData.length)
            obj = this.subData[++this.index];
            return obj;
    }



}
