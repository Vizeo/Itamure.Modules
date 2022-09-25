import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PrintDetailComponent } from './printDetails.component';
import { PrinterStatusWidgetComponent } from './printerStatusWidget.component';
import { SettingsComponent } from './settings.component';
const routes = [
    { path: 'Settings', component: SettingsComponent },
    { path: 'PrinterStatusWidget', component: PrinterStatusWidgetComponent },
    { path: 'PrinterDetails', component: PrintDetailComponent },
    { path: '', component: SettingsComponent }
];
let AppRoutingModule = class AppRoutingModule {
};
AppRoutingModule = __decorate([
    NgModule({
        imports: [RouterModule.forRoot(routes)],
        exports: [RouterModule]
    })
], AppRoutingModule);
export { AppRoutingModule };
//# sourceMappingURL=app-routing.module.js.map