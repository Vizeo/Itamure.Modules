import { Component, Input } from '@angular/core';
import { VideoFileMediaItem } from '../../Services/mediaServer.service';
import { MediaItemService } from '../../Services/mediaItem.service';

@Component({
    selector: 'seriesVideo',
    templateUrl: './seriesVideo.component.html',
    styleUrls: ['./seriesVideo.component.less']
})
export class SeriesVideoComponent {
    constructor(private mediaItemService: MediaItemService) {
    }

    private _videoFileMediaItem: VideoFileMediaItem | undefined;
    private _name: string | undefined;
    private _directory: string | undefined;

    @Input("video")
    public set VideoFileMediaItem(val: VideoFileMediaItem | undefined) {
        this._videoFileMediaItem = val;
        this._name = this.mediaItemService.FindName(val!);
        this._directory = this.mediaItemService.FindDirectory(val!);
    }

    public get VideoFileMediaItem(): VideoFileMediaItem | undefined {
        return this._videoFileMediaItem;
    }

    public get Name(): string | undefined {
        return this._name;
    }

    public get Directory(): string | undefined {
        return this._directory;
    }
}
