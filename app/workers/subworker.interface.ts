
//CHECK:name
export interface ISubWorkerRequest{
    function:functions,
    path:string,
    encoding:string,
    time:number         
}

export interface ISubWorkerResponse{
    function:functions,
    success:boolean,
    error:string,
    encodings:IEncoding[],
    dialogWordList:IDialogWord[]
}

export interface IEncoding{
     confidence: number,
     charsetName: string,
     lang: string
}

export interface IDialogWord{
    text:string,
    isWord:boolean
}

//CHECK:name
export enum functions{
    loadSubtitle,
    detectEncoding,
    getDialogWordList
}