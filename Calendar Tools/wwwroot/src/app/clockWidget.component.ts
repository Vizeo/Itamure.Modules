import { Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CalendarToolsService, CalendarItemData } from './Services/calendarTools.service';

@Component({
    selector: 'clockWidget',
    templateUrl: './clockWidget.component.html',
    styleUrls: ['./clockWidget.component.less']
})
export class ClockWidgetComponent {    
    constructor(private hostRef: ElementRef<HTMLDivElement>) {
        window.addEventListener("onSettingsLoaded", () => {
            this.Settings = (<any>window).WidgetSettings;
            this.Setup();
            this.UpdateClock();
        });

        window.addEventListener("onSettingsChange", () => {
            this.Setup();
            this.UpdateClock();
        });
    } 

    private _handle: any = null;

    //public Hours: string = "00";
    //public Minutes: string = "00";
    //public Seconds: string = "00";
    //public Part: string = "AM";
    public Time: string = "00:00:00";
    public Settings: any | null = null
    public TwentyFourHour: boolean = false;
    public ShowSeconds: boolean = false;

    private Setup() {
        if (this.Settings.TwentyFourHour != null) {
            this.TwentyFourHour = this.Settings.TwentyFourHour;
        }

        if (this.Settings.ShowSeconds != null) {
            this.ShowSeconds = this.Settings.ShowSeconds;
        }

        if (this.Settings.Color != null) {
            this.hostRef!.nativeElement.style.setProperty("--color", this.Settings.Color);
        }

        if (this.Settings.BackgroundColor != null) {
            this.hostRef!.nativeElement.style.setProperty("--backgroundColor", this.Settings.BackgroundColor);
        }
    }

    private UpdateClock() {
        //Only doing minutes at the moment
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();

        let part = "";
        let hours: string;
        let minutes: string;
        let seconds = "";

        if (!this.TwentyFourHour) {
            part = h > 12 ? "PM" : "AM";
            var h = h % 12;
            if (h == 0) {
                h = 12;
            }

            hours = this.Harold(h);
        }
        else {
            part = "";
            hours = this.Harold(12);
        }

        if (this.ShowSeconds == true) {
            seconds = ":" + this.Harold(s);
        }

        minutes = this.Harold(m);

        this.Time = hours + ":" + minutes + " " + part;

        setTimeout(() => this.UpdateClock(), 1000); //10 sec
    }

    private Harold(val: number): string {
        if (val < 10) {
            return "0" + val;
        }
        return val.toString();
    }

    ngOnDestroy() {
        if (this._handle != null) {
            clearTimeout(this._handle);
        }
    }
}
