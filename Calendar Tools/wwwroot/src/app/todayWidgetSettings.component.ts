import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
    selector: 'todayWidgetSettings',
    templateUrl: './todayWidgetSettings.component.html',
    styleUrls: ['./todayWidgetSettings.component.less']
})
export class TodayWidgetSettingsComponent {    
    constructor(private hostRef: ElementRef<HTMLDivElement>) {
        window.addEventListener("onSettingsLoaded", () => {
            this.Settings = (<any>window).WidgetSettings;

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
