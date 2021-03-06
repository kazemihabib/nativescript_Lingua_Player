require("globals");
import {Tokenizer} from "../utils/tokenizer";
let _ = require('underscore');
let encodingDetector = require('charset-detector');
let srtParser = require('subtitles-parser');
let franc = require('franc');

import * as fs from 'file-system';
import * as ISubWorker from './subworker.interface';


global.sendResponseFromWorker = function(method:ISubWorker.functions,success:boolean,error:string,
                                encodings:ISubWorker.IEncoding[],subData:ISubWorker.ISrtObject[],isRTL:boolean,path:string){
    let data : ISubWorker.ISubWorkerResponse;
    data = {'function':method , 'success':success , 'error':error,
                    'encodings':encodings ,'subData':subData,'isRTL':isRTL,pathAsId:path};

    global.postMessage(data);

}

global.onmessage = (msg) => {
        let request:ISubWorker.ISubWorkerRequest = msg.data;

        if(ISubWorker.functions.loadSubtitle == request.function){
            let error;
            let subData:ISubWorker.ISrtObject[],isRtl:boolean;
            let path:string;
            [subData,isRtl] = global.loadSubtitle(request.path,(e)=>{error = e},request.encoding);

            global.sendResponseFromWorker(ISubWorker.functions.loadSubtitle,!error,error,undefined,subData,isRtl,path);
        }        
        else if(ISubWorker.functions.detectEncoding == request.function){
            let error;
            let path:string;
            let encodings = global.detectEncoding(request.path,(e)=>{error = e});

            global.sendResponseFromWorker(ISubWorker.functions.detectEncoding,!error,error,encodings,undefined,undefined,path);                        

        }
}



global.loadSubtitle = (path:string, errorCallback:(error : any) => any , encoding?:string,): [ISubWorker.ISrtObject[],boolean] => {
        //TODO:detect file type with magic number , size  and ... to prevent loading not srt files with srt extenstion
        //loading other files (not srt) can take too long and should warn fastly the user it's not a srt
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
        
        let isRtl:boolean = global.isRTL(rawData)
        //convert to json
        let tempSrtObject:ISubWorker.ISrtObject[] = srtParser.fromSrt(rawData ,true);
        tempSrtObject.forEach((item,i)=>{
            item.wordList= Tokenizer.splitWords(item.text);
            subData.push(item);
        })
        return [subData,isRtl];
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

global.isRTL = (data:string)=>{
        let lang = franc(data);
        let languages: string[] = [
            'arb', /* 'العربية', Arabic */
            'aii', /* Aramaic */
            'ckb', /* 'Soranî / کوردی', Sorani */
            'pes', /* 'فارسی', Persian */
            'heb', /* 'עברית', Hebrew */
            'urd', /* 'اردو', Urdu */
            'ydd' /* 'ייִדיש', Yiddish */
        ];
      return languages.indexOf(lang.toLowerCase()) >= 0 ? true : false;

}