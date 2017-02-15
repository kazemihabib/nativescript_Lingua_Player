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
import {FilePicker} from "./dialogs/file_picker/file_picker_dialog";
import {AccelerationSelector} from "./dialogs/acceleration_selector/acceleration_selector";
import {AudioSelector} from "./dialogs/audio_selector/audio_selector";
import {ResumeConfirm} from "./dialogs/resume_confirm/resume_confirm";
import {DictionaryDialog} from "./dialogs/dictionary_dialog/dictionary_dialog";
import {NotFound } from "./dialogs/not_found/not_found";
import { registerElement } from "nativescript-angular/element-registry";

import {Dictionary} from "./services/dictionary.service"

registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown);

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
        FilePicker,
        AccelerationSelector,
        AudioSelector,
        ResumeConfirm,
        DictionaryDialog,
        NotFound

    ],
    entryComponents: [FilePicker,AccelerationSelector,AudioSelector,ResumeConfirm,DictionaryDialog,NotFound],
    providers: [ // singleton services
        Dictionary
    ],
    bootstrap: [
        AppComponent
    ]
})
class AppComponentModule {}

platformNativeScriptDynamic().bootstrapModule(AppComponentModule);