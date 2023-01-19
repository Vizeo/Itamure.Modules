import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarDisplayComponent } from './calendarDisplay.component';
import { SettingsComponent } from './settings.component';
import { TodayWidgetComponent } from './todayWidget.component';

const routes: Routes = [
  { path: 'Settings', component: SettingsComponent },
  { path: 'TodayWidget', component: TodayWidgetComponent },
  { path: 'CalendarDisplay', component: CalendarDisplayComponent },
  { path: '', component: SettingsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
