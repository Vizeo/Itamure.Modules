import { Component } from '@angular/core';
import { VideoGroupBaseComponent } from './videoGroupBase.component';
import { MediaService, FolderTree } from '../../../Services/mediaServer.service';

@Component({
    selector: 'dateRangeVideoGroup',
    templateUrl: './dateRangeVideoGroup.component.html',
    styleUrls: ['./dateRangeVideoGroup.component.less']
})
export class DateRangeVideoGroupComponent extends VideoGroupBaseComponent {
    constructor(private mediaService: MediaService) {
        super();
    }   

    public Start?: number;
    public End?: number;

    public ngAfterViewInit() {
        if (this.VideoGroup != null &&
            this.VideoGroup.Options != null) {
            let options = <Options>JSON.parse(this.VideoGroup.Options);
            this.Start = options.Start;
            this.End = options.End;
        }
    }

    public Update() {
        let options = new Options();
        options.Start = this.Start;
        options.End = this.End;
        this.VideoGroup!.Options = JSON.stringify(options);
    }
}

class Options {
    public Start?: number;
    public End?: number;
}
