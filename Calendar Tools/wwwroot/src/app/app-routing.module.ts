import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarDisplayComponent } from './calendarDisplay.component';
import { SettingsComponent } from './settings.component';
import { TodayWidgetComponent } from './todayWidget.component';
<<<<<<< HEAD
import { ClockWidgetComponent } from './clockWidget.component';
import { ClockWidgetSettingsComponent } from './clockWidgetSettings.component';
import { TodayWidgetSettingsComponent } from './todayWidgetSettings.component';

const routes: Routes = [
    { path: 'Settings', component: SettingsComponent },
    { path: 'TodayWidget', component: TodayWidgetComponent },
    { path: 'TodayWidgetSettings', component: TodayWidgetSettingsComponent },
    { path: 'ClockWidget', component: ClockWidgetComponent },
    { path: 'ClockWidgetSettings', component: ClockWidgetSettingsComponent },
    { path: 'CalendarDisplay', component: CalendarDisplayComponent },
    { path: '', component: SettingsComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
=======

const routes: Routes = [
  { path: 'Settings', component: SettingsComponent },
  { path: 'TodayWidget', component: TodayWidgetComponent },
  { path: 'CalendarDisplay', component: CalendarDisplayComponent },
  { path: '', component: SettingsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
>>>>>>> 59206c8022c61c0e01b2fb31a5db4a2f17b4e705
})
export class AppRoutingModule { }
