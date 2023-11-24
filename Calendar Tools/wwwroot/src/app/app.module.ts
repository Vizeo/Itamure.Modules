import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { CalendarDisplayComponent } from './calendarDisplay.component';
import { SettingsComponent } from './settings.component';
import { TodayWidgetComponent } from './todayWidget.component';
import { IconComponent } from './icon.component';
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
})
export class AppModule { }
