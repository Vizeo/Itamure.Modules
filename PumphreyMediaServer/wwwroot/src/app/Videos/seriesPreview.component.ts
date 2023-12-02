import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Rating, Series, VideoFileMediaItem } from '../Services/mediaServer.service';
import { MediaItemService } from '../Services/mediaItem.service';

@Component({
    selector: 'seriesPreview',
    templateUrl: './seriesPreview.component.html',
    styleUrls: ['./seriesPreview.component.less']
})
export class SeriesPreviewComponent {
    constructor(private mediaItemService: MediaItemService) {
    }

    private _series: Series | null = null;

    public Image: string = "";
    public Rating: string | null = null;
    public HasImageError: boolean = false;

    @Input('ratings')
    public Ratings: Rating[] | undefined;

    @Input('series')
    public set Series(series: Series | null) {
        this._series = series;
        this.Image = "/mediaServer/api/mediaServerService/GetSeriesImage?seriesId=" + this.Series!.Id! + "&date=" + (new Date().getTime());;
    }

    public get Series(): Series | null {
        return this._series;
    }

    public ImageError() {
        this.Image = "/MediaServer/assets/UnknownMedia.svg";
        this.HasImageError = true;
    }

    ngAfterViewInit() {
        let rating = this.Ratings?.find(r => r.Id == this._series!.RatingId);
        if (rating != null) {
            this.Rating = rating.Name!;
        }
    }
}
