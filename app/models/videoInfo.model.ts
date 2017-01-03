var fs = require("file-system");

export class VideoInfo{
    public path:string;
    public title:string;
    public length:number;
    public position:number;
    public subLocation:string;
    //TODO change this name
    public thumbnail:string; //thumbnail path

    getTitle(path:string) {
        var file = fs.File.fromPath(path);
        return file.name;
    }

    constructor(path: string, title?: string, length?: number, position?: number, subLocation?: string, thumbnail?: string) {
        this.path = path;
        //I added this to show a title in listview before thumbnails becam ready
        if(title){
            this.title = title;
        }
        else{
            this.title = this.getTitle(path);
        }

        this.length = length;
        this.position = position;
        this.subLocation = subLocation;
        this.thumbnail = thumbnail;
    }
}