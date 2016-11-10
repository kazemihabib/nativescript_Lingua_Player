require("globals");
import {Tokenizer} from "../services/tokenizer";
let _ = require('underscore');
let encodingDetector = require('charset-detector');
let srtParser = require('subtitles-parser');
import * as fs from 'file-system';
import * as ISubWorker from './subworker.interface';


global.myPostMessage = function(method:ISubWorker.functions,success:boolean,error:string,
                                encodings:ISubWorker.IEncoding[],subData:ISubWorker.ISrtObject[]){
    let data : ISubWorker.ISubWorkerResponse;
    data = {'function':method , 'success':success , 'error':error,
                    'encodings':encodings ,'subData':subData}

    global.postMessage(data);

}

global.onmessage = (msg) => {
        let request:ISubWorker.ISubWorkerRequest = msg.data;

        if(ISubWorker.functions.loadSubtitle == request.function){
            let error;
            let subData:ISubWorker.ISrtObject[] = global.loadSubtitle(request.path,(e)=>{error = e},request.encoding);

            global.myPostMessage(ISubWorker.functions.loadSubtitle,!error,error,undefined,subData);
        }        
        else if(ISubWorker.functions.detectEncoding == request.function){
            let error;
            let encodings = global.detectEncoding(request.path,(e)=>{error = e});

            global.myPostMessage(ISubWorker.functions.detectEncoding,!error,error,encodings,undefined);                        

        }
}



global.loadSubtitle = (path:string, errorCallback:(error : any) => any , encoding?:string,): ISubWorker.ISrtObject[] => {
        let sourceFile ;
        let rawData;
        let subData:Array<ISubWorker.ISrtObject>=[];
        try{
            encoding = typeof encoding !== 'undefined' ? encoding : global.detectEncoding(path,e => {throw e})[0]["charsetName"]; 
            sourceFile = fs.File.fromPath(path);
            rawData = sourceFile.readTextSync(e => {throw e} ,encoding);
        }catch (e){
           return errorCallback(e) 
        }
        //convert to json
        let tempSrtObject:ISubWorker.ISrtObject[] = srtParser.fromSrt(rawData ,true);
        tempSrtObject.forEach((item,i)=>{
            item.wordList= Tokenizer.splitWords(item.text);
            subData.push(item);
        })
        return subData;
    }

global.detectEncoding = (path:string, errorCallback:(error:any) => any) : ISubWorker.IEncoding[] => {
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
