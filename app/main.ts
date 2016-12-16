// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic, NativeScriptModule } from "nativescript-angular/platform";
import { NgModule } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { AppComponent } from "./app.component";
import {routes,navigatableComponents} from "./app.routing"
import { NativeScriptRouterModule } from "nativescript-angular/router";
import {DurationPipe} from "./pipes/duration.pipe";

import { LISTVIEW_DIRECTIVES } from 'nativescript-telerik-ui/listview/angular';
import {VLCComponent} from "./components/vlc.component"
import {DialogContent} from "./dialogs/dialogContent";

import { TNSFontIconModule} from 'nativescript-ng2-fonticon';
@NgModule({
    imports: [
        NativeScriptModule,
        NativeScriptRouterModule,
        NativeScriptFormsModule,
        NativeScriptRouterModule.forRoot(routes),
        TNSFontIconModule.forRoot({
            'mdi': 'material-design-icons.css'
        })

    ],
    declarations: [
        LISTVIEW_DIRECTIVES,
        AppComponent,
        ...navigatableComponents,
        VLCComponent,
        DurationPipe,
        DialogContent
    ],
    entryComponents: [DialogContent],
    bootstrap: [
        AppComponent
    ]
})
class AppComponentModule {}

platformNativeScriptDynamic().bootstrapModule(AppComponentModule);