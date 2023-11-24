import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
    selector: 'clockWidgetSettings',
    templateUrl: './clockWidgetSettings.component.html',
    styleUrls: ['./clockWidgetSettings.component.less']
})
export class ClockWidgetSettingsComponent {    
    constructor(private hostRef: ElementRef<HTMLDivElement>) {
        window.addEventListener("onSettingsLoaded", () => {
            this.Settings = (<any>window).WidgetSettings;

            if (this.Settings.TwentyFourHour == null) {
                this.Settings.TwentyFourHour = false;
            }

            if (this.Settings.ShowSeconds == null) {
                this.Settings.ShowSeconds = false;
            }

            if (this.Settings.Color == null) {
                this.Settings.Color = getComputedStyle(hostRef.nativeElement).getPropertyValue("--color");
            }

            if (this.Settings.BackgroundColor == null) {
                this.Settings.BackgroundColor = getComputedStyle(hostRef.nativeElement).getPropertyValue("--backgroundColor");
            }
       });
    } 

    public Settings: any | null = null
}
