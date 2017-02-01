export interface ISubWorkerRequest{
    function:functions,
    path:string,
    encoding:string,
}

export interface ISubWorkerResponse{
    function:functions,
    success:boolean,
    error:string,
    encodings:IEncoding[],
    subData:ISrtObject[],
    isRTL:boolean,
    pathAsId:string;
}

export interface IEncoding{
     confidence: number,
     charsetName: string,
     lang: string
}

export enum functions{
    loadSubtitle,
    detectEncoding,
    getDialogWordList
}


export interface ISrtObject{
     id:string,
     startTime:string,
     endTime:string,
     text:string ,
     wordList?:{'text':string}[]
}