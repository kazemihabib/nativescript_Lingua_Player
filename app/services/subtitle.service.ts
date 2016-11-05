import { Injectable } from '@angular/core';
import {Tokenizer} from "./tokenizer";
let _ = require('underscore');
let encodingDetector = require('charset-detector');
let srtParser = require('subtitles-parser');
import * as fs from 'file-system';

@Injectable()
export class Subtitle{
    private subData:Array<Object>= []; 
    private encoding:string; 

    public loadSubtitle(path:string,encoding?:string){
        // if(!path)
            // return -1;
        encoding = typeof encoding !== 'undefined' ? encoding : this.detectEncoding(path)[0]["charsetName"]; 
        let sourceFile = fs.File.fromPath(path);
        let rawData = sourceFile.readTextSync(e => {console.log('error when loading subtitle')},encoding);
        //convert to json
        let tempSrtObject:{id:string,startTime:string,endTime:string,
                        text:string ,wordList?:{'text':string}[] } [] = srtParser.fromSrt(rawData ,true);
                        
        tempSrtObject.forEach((item,i)=>{
            item.wordList= Tokenizer.splitWords(item.text).reverse();
            this.subData.push(item);
        })

    }

    public detectEncoding(path:string){
        let sourceFile = fs.File.fromPath(path);
        let binaryData= sourceFile.readSync(e=> {console.log('error happend when detecting encoding')});


        let jsArray:Array<number>=[];
        let length = binaryData.length;
        for(let i=0;i<length ; i++){
            jsArray.push(binaryData[i]);
        }
        
        let encodings= encodingDetector(jsArray);
        return encodings;
    }

    public getText(time:number):any{
        let index = _.sortedIndex(this.subData, {startTime: time}, function(sub){return sub.startTime});
        index--;
        if(index<0)
            //return empty wordList
            return [{'text':'','isWord':false}];
        
        let obj:any = this.subData[index];

        if(time > obj.endTime)
            //return empty wordList
            return [{'text':'','isWord':false}];
        return obj.wordList;
    } 

}
