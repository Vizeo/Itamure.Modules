import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { PrinterInfo } from './services/octoprintMonitor.service';
let SettingsComponent = class SettingsComponent {
    constructor(octoprintMonitorService) {
        this.octoprintMonitorService = octoprintMonitorService;
        this.Printers = null;
        this.SelectedPrinter = null; //This will be a proxy
        this.EditingPrinter = null;
        this.GetPrinters();
    }
    async GetPrinters() {
        this.Printers = await this.octoprintMonitorService.GetCurrentInstances();
    }
    Add() {
        this.EditingPrinter = new PrinterInfo();
        this.SelectedPrinter = this.EditingPrinter;
    }
    async Remove() {
        if (this.SelectedPrinter) {
            let removingPrinter = this.SelectedPrinter;
            if (confirm("Remove printer " + this.SelectedPrinter.Name + "?")) {
                await this.octoprintMonitorService.Remove(this.SelectedPrinter);
                if (this.Printers != null) {
                    const index = this.Printers.indexOf(removingPrinter);
                    if (index > -1) {
                        this.Printers.splice(index, 1);
                    }
                }
                if (this.SelectedPrinter == removingPrinter) {
                    this.SelectedPrinter = null;
                    this.EditingPrinter = null;
                }
            }
        }
    }
    HasPermission() {
        if (window.hasPermission != null) {
            return window.hasPermission("OctoprintMonitor.ModifySettings");
        }
        return false;
    }
    async Save() {
        var _a;
        let savingPrinter = this.EditingPrinter;
        let updatingPrinter = this.SelectedPrinter;
        if (this.CanSave() &&
            savingPrinter != null) {
            if (savingPrinter.Id == null) {
                savingPrinter.Id = await this.octoprintMonitorService.Add(savingPrinter);
                (_a = this.Printers) === null || _a === void 0 ? void 0 : _a.unshift(savingPrinter);
            }
            else {
                await this.octoprintMonitorService.Update(savingPrinter);
                //A lot can happen when while waiting for updates.
                //The user may have selected a new printer
                if (updatingPrinter != null) {
                    updatingPrinter.Address = savingPrinter.Address;
                    updatingPrinter.ApiKey = savingPrinter.ApiKey;
                    updatingPrinter.Name = savingPrinter.Name;
                }
            }
        }
    }
    SetSelected(printer) {
        this.SelectedPrinter = printer;
        //Create a copy of the printer that can be edited
        //without changing the original.
        this.EditingPrinter = Object.assign({}, printer);
    }
    CanSave() {
        return this.EditingPrinter != null &&
            this.EditingPrinter.Name != null &&
            this.EditingPrinter.ApiKey != null &&
            this.EditingPrinter.Address != null &&
            this.EditingPrinter.Name.length > 1 &&
            this.EditingPrinter.ApiKey.length > 1 &&
            this.EditingPrinter.Address.length > 1;
    }
};
SettingsComponent = __decorate([
    Component({
        selector: 'settings',
        templateUrl: './settings.component.html',
        styleUrls: ['./settings.component.less']
    })
], SettingsComponent);
export { SettingsComponent };
//# sourceMappingURL=settings.component.js.map