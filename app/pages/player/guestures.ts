import gestures = require("ui/gestures");
import {Brightness} from '../../utils/brightness';
import {IGuestureEventCallbacks} from "./guesture.interface";


export enum Direction{
  vertical,
  horizontal
}

export class Guestures{
    public volumeChartVisible = false;
    public brightnessChartVisible = false;
    public seekUiVisibile = false;

    //used in player.component.html dirctly
    public currentVolume;
    public currentBrightness;

    private max;

    public prevY:number = null;
    public prevX:number = null;
    private direction = null;

    public BrightnessVisible: boolean = false;
    public seekCharVisible: boolean =false;
    public deltaSeek: number = 0;

    private leftSideHandling:boolean = false;
    private rightSideHandling:boolean = false;
    constructor(private vlcAction, private eventCallbacks:IGuestureEventCallbacks,private _ngZone){
        this.max = this.vlcAction.getVolume().maxVolume;
        console.log('max ' + this.max);

    }

    public rightLabel:any;
    public rightSideguestures(lbl:any){
      let that = this;
      that.rightLabel = lbl;
      that.rightLabel.on(gestures.GestureTypes.touch, function (args: gestures.TouchGestureEventData) {
          if(that.leftSideHandling){
              return
          }
          if('up' === args.action){
            that.rightSideHandling = false;
            that._ngZone.run(() => {
                that.volumeChartVisible = false;
                that.seekUiVisibile = false;
                that.deltaSeek = 0;
            });
            that.prevX = that.seek(args.getX(),that.direction,that.prevX);
            that.prevY = 0;
            that.prevX = 0;
            that.direction = null;
          }

          if('down' == args.action){
            that.rightSideHandling = true;
            that.prevY = args.getY();
            that.prevX = args.getX();
          }

          if('move' == args.action)
          {

            that.direction = that.detectDirection(that.direction,args.getY(),args.getX(),that.prevY,that.prevX);

            if(Direction.vertical == that.direction)
            {
                    that._ngZone.run(() => {
                        that.volumeChartVisible = true;
                    });
                    that.prevY = that.changeVolume(args.getY(), that.prevY);
            }

            if(Direction.horizontal == that.direction)
            {
                    that._ngZone.run(() => {
                        that.seekUiVisibile = true;
                        that.deltaSeek = Math.floor(args.getX() - that.prevX)*100;
                        that.seekCharVisible = true;
                    });
            }

          }
      });

    }

    public leftLabel:any;
    public leftSideguestures(lbl:any){
      let that = this;
      that.leftLabel = lbl;
      that.leftLabel.on(gestures.GestureTypes.touch, function (args: gestures.TouchGestureEventData) {
          if(that.rightSideHandling)
          {
              return;
          }
          if('up' === args.action){
            that.leftSideHandling = false;
            that._ngZone.run(() => {
                that.brightnessChartVisible = false;
                that.seekUiVisibile = false;
                that.deltaSeek = 0 ;
            });
            that.prevX = that.seek(args.getX(),that.direction,that.prevX);
            that.prevY = 0;
            that.prevX = 0;
            that.direction = null;
          }

          if('down' == args.action){
            that.leftSideHandling = true;
            that.prevY = args.getY();
            that.prevX = args.getX();
          }

          if('move' == args.action)
          {

            that.direction = that.detectDirection(that.direction,args.getY(),args.getX(),that.prevY,that.prevX);

            if (Direction.vertical == that.direction) {
                    that._ngZone.run(() => {
                        that.brightnessChartVisible = true;
                    });
                    that.prevY = that.changeBrightness(args.getY(), that.prevY);
            }
            if(Direction.horizontal == that.direction)
            {
                that._ngZone.run(() => {
                    that.seekUiVisibile = true;
                    that.deltaSeek = Math.floor(args.getX() - that.prevX) * 100;
                    that.seekCharVisible = true;
                });
            }

          }
      });

    }

    private changeBrightness(currentY:number,  prevY:number){
        let deltaY = currentY - prevY;;

        if(Math.abs(deltaY) > 10)
        {

            if(-deltaY > 0)
                this.setBrightness(+1);                
            else
                this.setBrightness(-1);
            return currentY;
        }
        return prevY;
    }

    private setBrightness(value:number){

        this._ngZone.run(() => {
            this.currentBrightness = Brightness.getBrightness();

            this.currentBrightness = Math.floor(this.currentBrightness * 15) + value;
            this.currentBrightness = Math.max(this.currentBrightness,0);
            this.currentBrightness = Math.min(this.currentBrightness,15);
        });

        Brightness.setBrightness(this.currentBrightness / 15);

        console.log('birightness ' + Math.floor(this.currentBrightness));
    }

    

    private changeVolume (currentY:number,  prevY:number){
        let deltaY = currentY - prevY;;

        if(Math.abs(deltaY) > 10)
        {

            if(-deltaY > 0)
            {
                this._ngZone.run(() => {
                    this.currentVolume = this.vlcAction.volumeUp().currentVolume;
                });
            }
            else{
                this._ngZone.run(() => {
                    this.currentVolume = this.vlcAction.volumeDown().currentVolume;
                });
            }
            // this.prevY = currentY;
            console.log('currentVolume: ' + this.currentVolume);
            return currentY;
        }
        return prevY;
    }


    private detectDirection(currentDirection:Direction,currentY:number,currentX:number,prevY:number,prevX:number){
        let deltaY = currentY - prevY;
        let deltaX = currentX - prevX;

        if(null === currentDirection){
            if(Math.abs(deltaX) >= 5 || Math.abs(deltaY) >= 5) {
            
            if(Math.abs(deltaX) >= Math.abs(deltaY))
                return Direction.horizontal;
            else
                return Direction.vertical;
          }
        }

        return currentDirection;
    }

    private seek(currentX:number,direction:Direction,prevX:number){

            let deltaX; 
            if(Direction.horizontal == direction){

                    deltaX = Math.floor(currentX - prevX)*100;

                    console.log(deltaX);
                    let movieLength = this.vlcAction.getLength();
                    let position = this.vlcAction.getPosition() + deltaX;
                    if(position < 0)
                        position = 0;
                    if(position > movieLength)
                        position = movieLength;

                    this.vlcAction.seek(position);
                    this.eventCallbacks.seekEventFired();
                    console.log('deltaX ' + deltaX);
                    return currentX;
            }
            return prevX;
    }

}