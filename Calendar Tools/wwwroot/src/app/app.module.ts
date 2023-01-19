import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CalendarDisplayComponent } from './calendarDisplay.component';
import { SettingsComponent } from './settings.component';
import { TodayWidgetComponent } from './todayWidget.component';

@NgModule({
  declarations: [
    AppComponent,
    TodayWidgetComponent,
    SettingsComponent,
    CalendarDisplayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
