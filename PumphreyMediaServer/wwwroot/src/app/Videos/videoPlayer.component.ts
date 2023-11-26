import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { VideoFileMediaItem } from '../Services/mediaServer.service';
import { MediaItemService } from '../Services/mediaItem.service';

@Component({
    selector: 'videoPlayer',
    templateUrl: './videoPlayer.component.html',
    styleUrls: ['./videoPlayer.component.less']
})
export class VideoPlayerComponent {
    constructor(private elRef: ElementRef) {
    }

    private _videoFileMediaItem: VideoFileMediaItem | undefined;

    @Input("videoFileMediaItem")
    public set VideoFileMediaItem(value: VideoFileMediaItem | undefined) {
        this._videoFileMediaItem = value;
        if (value != null) {
            const player = this.elRef.nativeElement.querySelector('video');
            player.load();
            player.src = "/mediaServer/streamingService?mediaItemId=" + this._videoFileMediaItem?.Id;
            player.play();
        }
    }

    @Input("autoplay")
    public Autoplay: boolean = true;

    public Play() {
        const player = this.elRef.nativeElement.querySelector('video');
        player.play();
    }

    public Stop() {
        const player = this.elRef.nativeElement.querySelector('video');
        player.pause();
    }

    ngAfterViewInit() {
        const player = this.elRef.nativeElement.querySelector('video');
    }
}
