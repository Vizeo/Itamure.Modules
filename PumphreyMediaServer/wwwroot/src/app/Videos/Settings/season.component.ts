import { Component, Input } from '@angular/core';
import { Season } from '../../Services/mediaServer.service';
import { MediaItemService } from '../../Services/mediaItem.service';

@Component({
    selector: 'season',
    templateUrl: './season.component.html',
    styleUrls: ['./season.component.less']
})
export class SeasonComponent {
    constructor(private mediaItemService: MediaItemService) {
    }


    @Input("season")
    public Season: Season | null = null;

    public get Name(): string | undefined {
        return this.Season!.Name!;
    }
}
