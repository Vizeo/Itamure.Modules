import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { VideoFileMediaItem } from '../../Services/mediaServer.service';
import { MediaItemService } from '../../Services/mediaItem.service';

@Component({
    selector: 'episodeVideo',
    templateUrl: './episodeVideo.component.html',
    styleUrls: ['./episodeVideo.component.less']
})
export class EpisodeVideoComponent {
    constructor(private mediaItemService: MediaItemService) {
    }

    private _videoFileMediaItem: VideoFileMediaItem | undefined;
    private _name: string | undefined;
    private _directory: string | undefined;

    ngAfterViewInit() {
        this.GetImage();
    }

    @ViewChild("image")
    private _image: ElementRef<HTMLImageElement> | undefined;

    @Input("video")
    public set VideoFileMediaItem(val: VideoFileMediaItem | undefined) {
        this._videoFileMediaItem = val;
        this.Reload();
    }

    public get VideoFileMediaItem(): VideoFileMediaItem | undefined {
        return this._videoFileMediaItem;
    }

    private GetImage() {
        if (this._image != null) {
            this._image!.nativeElement.src = "/mediaServer/api/mediaServerService/GetVideoFileMediaItemImage?mediaItemId=" + this._videoFileMediaItem!.Id! + "&date=" + this._videoFileMediaItem!.MetadataDate!.getTime();
        }
    }

    public ImageError() {
        this._image!.nativeElement.src = "/MediaServer/assets/UnknownMedia.svg";
    }

    public get Name(): string | undefined {
        return this._name;
    }

    public get Directory(): string | undefined {
        return this._directory;
    }

    public Reload() {
        this._name = this.mediaItemService.FindName(this._videoFileMediaItem!);
        this._directory = this._videoFileMediaItem!.FilePath!;
        this.GetImage();
    }
}
