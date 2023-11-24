import { Component } from '@angular/core';
import { OctoprintMonitorService, PrinterInfo } from './services/octoprintMonitor.service';

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.less']
})
export class SettingsComponent {
    constructor(private octoprintMonitorService: OctoprintMonitorService) {
        this.GetPrinters();
    }    

    public Printers: PrinterInfo[] | null = null;
    public SelectedPrinter: PrinterInfo | null = null; //This will be a proxy
    public EditingPrinter: PrinterInfo | null = null;

    private async GetPrinters() {
        this.Printers = await this.octoprintMonitorService.GetCurrentInstances();
    }

    public Add() {
        this.EditingPrinter = new PrinterInfo();
        this.SelectedPrinter = this.EditingPrinter;
    }

    public async Remove() {
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

    public HasPermission(): boolean {
        if ((<any>window).hasPermission != null) {
            return (<any>window).hasPermission("OctoprintMonitor.ModifySettings");
        }
        return false;
    }

    public async Save() {
        let savingPrinter = this.EditingPrinter;
        let updatingPrinter = this.SelectedPrinter;
        if (this.CanSave() &&
            savingPrinter != null) {

            if (savingPrinter.Id == null) {
                savingPrinter.Id = await this.octoprintMonitorService.Add(savingPrinter);
                this.Printers?.unshift(savingPrinter);
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

    public SetSelected(printer: PrinterInfo): void {
        this.SelectedPrinter = printer;

        //Create a copy of the printer that can be edited
        //without changing the original.
        this.EditingPrinter = Object.assign({}, printer);
    }

    public CanSave(): boolean {
        return this.EditingPrinter != null &&
            this.EditingPrinter.Name != null &&
            this.EditingPrinter.ApiKey != null &&
            this.EditingPrinter.Address != null &&
            this.EditingPrinter.Name.length > 1 &&
            this.EditingPrinter.ApiKey.length > 1 &&
            this.EditingPrinter.Address.length > 1;
    }
}
