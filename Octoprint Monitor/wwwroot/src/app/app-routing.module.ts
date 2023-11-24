import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrintDetailComponent } from './printDetails.component';
import { PrinterStatus3DWidgetComponent } from './printerStatus3DWidget.component';
import { PrinterStatusWidgetComponent } from './printerStatusWidget.component';
import { SettingsComponent } from './settings.component';

const routes: Routes = [
    { path: 'Settings', component: SettingsComponent },
    { path: 'PrinterStatusWidget', component: PrinterStatusWidgetComponent },
    { path: 'PrinterStatus3DWidget', component: PrinterStatus3DWidgetComponent },
    { path: 'PrinterDetails', component: PrintDetailComponent },
    { path: '', component: SettingsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
