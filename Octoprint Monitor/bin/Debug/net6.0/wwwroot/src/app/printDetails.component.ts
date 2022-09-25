import { Component } from '@angular/core';
import { OctoprintMonitorService, PrinterInfo } from './services/octoprintMonitor.service';

@Component({
    selector: 'printDetails',
    templateUrl: './printDetails.component.html',
    styleUrls: ['./printDetails.component.less']
})
export class PrintDetailComponent {
    constructor(private octoprintMonitorService: OctoprintMonitorService) {
        //let params = (new URL(document.location)).searchParams;
        //let name = params.get("name");
    }    
}
