import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
<<<<<<< HEAD
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';

=======

import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
>>>>>>> 59206c8022c61c0e01b2fb31a5db4a2f17b4e705
import { AppComponent } from './app.component';
import { CalendarDisplayComponent } from './calendarDisplay.component';
import { SettingsComponent } from './settings.component';
import { TodayWidgetComponent } from './todayWidget.component';
import { IconComponent } from './icon.component';
<<<<<<< HEAD
import { ClockWidgetComponent } from './clockWidget.component';
import { ClockWidgetSettingsComponent } from './clockWidgetSettings.component';
import { TodayWidgetSettingsComponent } from './todayWidgetSettings.component';

@NgModule({
    declarations: [
        AppComponent,
        IconComponent,
        TodayWidgetComponent,
        TodayWidgetSettingsComponent,
        SettingsComponent,
        CalendarDisplayComponent,
        ClockWidgetComponent,
        ClockWidgetSettingsComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule
    ],
    providers: [],
    bootstrap: [AppComponent]
=======

@NgModule({
  declarations: [
    AppComponent,
    IconComponent,
    TodayWidgetComponent,
    SettingsComponent,
    CalendarDisplayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
>>>>>>> 59206c8022c61c0e01b2fb31a5db4a2f17b4e705
})
export class AppModule { }
