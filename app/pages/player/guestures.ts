import gestures = require("ui/gestures");
import application = require("application");


export enum Direction{
  vertical,
  horizontal
}

export class Guestures{

    public currentVolume;
    public currentBrightness = 0.5;
    private max;

    public prevY:number = null;
    public prevX:number = null;
    private direction = null;

    constructor(private vlcAction){
        this.max = this.vlcAction.getVolume().maxVolume;
        console.log('max ' + this.max);

    }


    public rightSideguestures(lbl:any){
      let that = this;
      lbl.on(gestures.GestureTypes.touch, function (args: gestures.TouchGestureEventData) {

          if('up' === args.action){

            that.prevX = that.seek(args.getX(),that.direction,that.prevX);
            that.prevY = 0;
            that.prevX = 0;
            that.direction = null;
          }

          if('down' == args.action){
            that.prevY = args.getY();
            that.prevX = args.getX();
          }

          if('move' == args.action)
          {

            that.direction = that.detectDirection(that.direction,args.getY(),args.getX(),that.prevY,that.prevX);

            if(Direction.vertical == that.direction)
            {
              that.prevY = that.changeVolume(args.getY(),that.prevY);
            }

          }
      });

    }

    public leftSideguestures(lbl:any){
      let that = this;
      lbl.on(gestures.GestureTypes.touch, function (args: gestures.TouchGestureEventData) {

          if('up' === args.action){
            
            that.prevX = that.seek(args.getX(),that.direction,that.prevX);
            that.prevY = 0;
            that.prevX = 0;
            that.direction = null;
          }

          if('down' == args.action){
            that.prevY = args.getY();
            that.prevX = args.getX();
          }

          if('move' == args.action)
          {

            that.direction = that.detectDirection(that.direction,args.getY(),args.getX(),that.prevY,that.prevX);

            if(Direction.vertical == that.direction)
            {
              that.prevY = that.changeBrightness(args.getY(),that.prevY);

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

        let lp = application.android.foregroundActivity.getWindow().getAttributes();

        this.currentBrightness =  Math.floor(lp.screenBrightness * 15) + value;
        this.currentBrightness = Math.max(this.currentBrightness,0);
        this.currentBrightness = Math.min(this.currentBrightness,15);

        lp.screenBrightness = this.currentBrightness/15;
        application.android.foregroundActivity.getWindow().setAttributes(lp);

        console.log('birightness ' + Math.floor(this.currentBrightness));
    }

    

    private changeVolume (currentY:number,  prevY:number){
        let deltaY = currentY - prevY;;

        if(Math.abs(deltaY) > 10)
        {

            if(-deltaY > 0)
            {
                this.currentVolume = this.vlcAction.volumeUp().currentVolume;
            }
            else{
                this.currentVolume = this.vlcAction.volumeDown().currentVolume;
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
                    this.vlcAction.seek(this.vlcAction.getPosition() + deltaX);
                    console.log('deltaX ' + deltaX);
                    return currentX;
            }
            return prevX;
    }

}