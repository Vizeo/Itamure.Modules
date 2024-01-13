import { Component } from '@angular/core';
import { CastService, Receiver } from '../Services/castService.service';

@Component({
    selector: 'activityWidget',
    templateUrl: './activityWidget.component.html',
    styleUrls: ['./activityWidget.component.less']
})
export class ActivityWidgetComponent {
    constructor(private castService: CastService) {
    }

    public get Receivers(): Receiver[] {
        return this.castService.Receivers;
    }

    public MakeTime(seconds: number): string {
        let minutes = Math.floor(seconds / 60);
        seconds %= 60;

        let hours = Math.floor(minutes / 60);
        minutes = minutes %= 60;

        let result = "";
        if (hours > 0) {
            if (hours < 10) {
                result += "0" + hours + ":";
            }
            else {
                result += hours + ":";
            }
        }
        else {
            result += "00:";
        }

        if (minutes > 0) {
            if (minutes < 10) {
                result += "0" + minutes + ":";
            }
            else {
                result += minutes + ":";
            }
        }
        else {
            result += "00:";
        }

        if (seconds > 0) {
            if (seconds < 10) {
                result += "0" + Math.floor(seconds);
            }
            else {
                result += Math.floor(seconds);
            }
        }
        else {
            result += "00";
        }

        return result;
    }
}
