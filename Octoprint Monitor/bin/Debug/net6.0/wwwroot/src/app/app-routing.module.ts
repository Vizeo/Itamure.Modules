import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrintDetailComponent } from './printDetails.component';
import { PrinterStatusWidgetComponent } from './printerStatusWidget.component';
import { SettingsComponent } from './settings.component';

const routes: Routes = [
    { path: 'Settings', component: SettingsComponent },
    { path: 'PrinterStatusWidget', component: PrinterStatusWidgetComponent },
    { path: 'PrinterDetails', component: PrintDetailComponent },
    { path: '', component: SettingsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
