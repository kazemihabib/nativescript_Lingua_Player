import application = require("application");

      
export class Brightness{
    public static getBrightness():number{
      let lp = application.android.foregroundActivity.getWindow().getAttributes();
      return lp.screenBrightness;
    }
    public static setBrightness(value:number){
      let lp = application.android.foregroundActivity.getWindow().getAttributes();
      lp.screenBrightness = value;
      application.android.foregroundActivity.getWindow().setAttributes(lp);
    }


}