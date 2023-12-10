import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { VideoFileMediaItem } from '../../Services/mediaServer.service';
import { MediaItemService } from '../../Services/mediaItem.service';

@Component({
    selector: 'movieVideo',
    templateUrl: './movieVideo.component.html',
    styleUrls: ['./movieVideo.component.less']
})
export class MovieVideoComponent {
    constructor(private mediaItemService: MediaItemService) {
    }

    private _videoFileMediaItem: VideoFileMediaItem | undefined;
    private _name: string | undefined;
    private _directory: string | undefined;
    private _imageLoaded: boolean = false;

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

    public get Name(): string | undefined {
        return this._name;
    }

    public get Directory(): string | undefined {
        return this._directory;
    }

    public ShowImage() {
        if (!this._imageLoaded) {
            this.GetImage();
            this._imageLoaded = true;
        }
    }

    private GetImage() {
        this._image!.nativeElement.src = "/mediaServer/api/mediaServerService/GetVideoFileMediaItemImage?mediaItemId=" + this._videoFileMediaItem!.Id! + "&date=" + this._videoFileMediaItem!.MetadataDate!.getTime();
    }

    public ImageError() {
        this._image!.nativeElement.src = "/MediaServer/assets/UnknownMedia.svg";
    }

    public Reload() {
        this._name = this.mediaItemService.FindName(this._videoFileMediaItem!);
        this._directory = this.mediaItemService.FindDirectory(this._videoFileMediaItem!);
        if (this._imageLoaded) {
            this.GetImage();
        }
    }
}
