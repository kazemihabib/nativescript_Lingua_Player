require("globals");
import {Tokenizer} from "../services/tokenizer";
let _ = require('underscore');
let encodingDetector = require('charset-detector');
let srtParser = require('subtitles-parser');
import * as fs from 'file-system';
import * as ISubWorker from './subworker.interface';

let subData:any=[];
global.myPostMessage = function(method:ISubWorker.functions,success:boolean,error:string,
                                encodings:ISubWorker.IEncoding[]){
    let data : ISubWorker.ISubWorkerResponse;
    data = {'function':method , 'success':success , 'error':error,
                    'encodings':encodings ,subData:subData}

    global.postMessage(data);

}

global.onmessage = (msg) => {
        console.log('onMessage in subtitle worker');
        let request:ISubWorker.ISubWorkerRequest = msg.data;

        if(ISubWorker.functions.loadSubtitle == request.function){
            let error;
            subtitle.loadSubtitle(request.path,(e)=>{error = e},request.encoding);

            global.myPostMessage(ISubWorker.functions.loadSubtitle,!error,error,undefined);
        }        
        else if(ISubWorker.functions.detectEncoding == request.function){
            let error;
            let encodings = subtitle.detectEncoding(request.path,(e)=>{error = e});

            global.myPostMessage(ISubWorker.functions.detectEncoding,!error,error,encodings,undefined);                        

        }
        // else if(ISubWorker.functions.getDialogWordList== request.function){
        //     // console.log('subtitle.workers getDialogWordList request');
        //     let dialogWordList = subtitle.getDialogWordList(request.time);
        //     //TODO:change this succes in getDialogWordList function that if indx <0 or ... return success false
        //     global.myPostMessage(ISubWorker.functions.getDialogWordList,true,undefined,undefined,dialogWordList); 


        // }

}


class Subtitle{
    // private subData:Array<Object>= []; 
    private encoding:string; 

    public loadSubtitle(path:string, errorCallback:(error : any) => any , encoding?:string,):void{
        console.log('loadSubtitle');
        // console.log('loa')
        // if(!path)
        let sourceFile ;// return -1;
        let rawData;
        try{
            encoding = typeof encoding !== 'undefined' ? encoding : this.detectEncoding(path,e => {throw e})[0]["charsetName"]; 
            sourceFile = fs.File.fromPath(path);
            rawData = sourceFile.readTextSync(e => {throw e} ,encoding);
        }catch (e){
           console.log('in catch');
           return errorCallback(e) 
        }
        //convert to json
        let tempSrtObject:{id:string,startTime:string,endTime:string,
                        text:string ,wordList?:{'text':string}[] } [] = srtParser.fromSrt(rawData ,true);
        tempSrtObject.forEach((item,i)=>{
            item.wordList= Tokenizer.splitWords(item.text).reverse();
            subData.push(item);
        })

    }

    public detectEncoding(path:string, errorCallback:(error:any) => any) : ISubWorker.IEncoding[]{
        let sourceFile = fs.File.fromPath(path);
        let binaryData;
        try{
            binaryData= sourceFile.readSync(e => {throw e});
        }catch(e){
            return errorCallback(e);
        }


        let jsArray:Array<number> = [];
        let length = binaryData.length;
        for(let i=0;i<length ; i++){
            jsArray.push(binaryData[i]);
        }
        
        let encodings= encodingDetector(jsArray);
        return encodings;
    }

    // public getDialogWordList(time:number) : ISubWorker.IDialogWord[]{
    //     // console.log('subtitle.worker.ts getDialogWordList');
    //     let index = _.sortedIndex(this.subData, {startTime: time}, function(sub){return sub.startTime});
    //     index--;
    //     if(index<0)
    //         //return empty wordList
    //         return [{'text':'','isWord':false}];
        
    //     let obj:any = this.subData[index];

    //     if(time > obj.endTime)
    //         //return empty wordList
    //         return [{'text':'','isWord':false}];
    //     return obj.wordList;
    // } 

}

let subtitle = new Subtitle();
console.log('new Subtitle');