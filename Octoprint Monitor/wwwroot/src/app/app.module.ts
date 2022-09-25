// @ts-ignore
import * as THREE from 'three';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

import { PrinterStatusWidgetComponent } from './printerStatusWidget.component';
import { SettingsComponent } from './settings.component';
import { IconComponent } from './icon.component';
import { PrintDetailComponent } from './printDetails.component';

@NgModule({
    declarations: [
        AppComponent,
        PrinterStatusWidgetComponent,
        SettingsComponent,
        IconComponent,
        PrintDetailComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
