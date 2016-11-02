/*Parse File*/
    //read file in byte
    //detect encoding of file
    //read file with encoding
    //convert that to js 
/*use the parsed file */
    //In the time sequence find the correct dialouge from json

import { Injectable } from '@angular/core';
import {Tokenizer} from "./tokenizer";
let _ = require('underscore');
let encodingDetector = require('charset-detector');
let srtParser = require('subtitles-parser');
// import * as sertParser from 'subtitles-parser';
import * as fs from 'file-system';

@Injectable()
export class Subtitle{
    private subData:Array<Object>= []; 
    private encoding:string; 
    // private maxSubtitleShowTime = 8000; //ms

    public loadSubtitle(path:string,encoding?:string){
        // if(!path)
            // return -1;

        encoding = typeof encoding !== 'undefined' ? encoding : this.detectEncoding(path)[0]["charsetName"]; 
        let sourceFile = fs.File.fromPath(path);
        // console.log('encoding');
        // console.log(encoding);
        let rawData = sourceFile.readTextSync(e => {console.log('error when loading subtitle')},encoding);
        // console.dump(rawData);
        //convert to json
        let tempData = srtParser.fromSrt(rawData ,true);
        tempData.forEach((item,i)=>{
            item.text = Tokenizer.splitWords(item.text).reverse();
            this.subData.push(item);
        })

        // console.dump(this.subData);
    }

    public detectEncoding(path:string){
        // if(!path)
            // return -1;
        let sourceFile = fs.File.fromPath(path);
        let binaryData= sourceFile.readSync(e=> {console.log('error happend when detecting encoding')});

        //convert java array to jsArray
        //with out doing this it will throw  java.lang.ArrayIndexOutOfBoundsException

        let jsArray:Array<number>=[];
        let length = binaryData.length;
        for(let i=0;i<length ; i++){
            jsArray.push(binaryData[i]);
        }
        
        let encodings= encodingDetector(jsArray);
        return encodings;
    }

    public getText(time:number):any{
        // if(!this.subData || !time)
            // return -1;
        // console.log('time '+time);
        let index = _.sortedIndex(this.subData, {startTime: time}, function(sub){return sub.startTime});
        index--;
        if(index<0)
            return [{'text':'','isWord':false}];
        
        let obj:any = this.subData[index];
        // console.log(index);
        if(time > obj.endTime)
            return [{'text':'','isWord':false}];
        return obj.text;
        // return Tokenizer.splitWords(obj.text)
    } 

    // public setMaxSubtitleShowTime(time:number/*ms*/){
    //     this.maxSubtitleShowTime = time;
    // }

}