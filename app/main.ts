// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic, NativeScriptModule } from "nativescript-angular/platform";
import { NgModule } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { AppComponent } from "./app.component";
import {routes,navigatableComponents} from "./app.routing"
import { NativeScriptRouterModule } from "nativescript-angular/router";

import {VLCComponent} from "./components/vlc.component"

@NgModule({
    imports: [
        NativeScriptModule,
        NativeScriptRouterModule,
        NativeScriptFormsModule,
        NativeScriptRouterModule.forRoot(routes)

    ],
    declarations: [
        AppComponent,
        ...navigatableComponents,
        VLCComponent
    ],
    bootstrap: [
        AppComponent
    ]
})
class AppComponentModule {}

platformNativeScriptDynamic().bootstrapModule(AppComponentModule);