import { Component, ElementRef, Input } from '@angular/core';
import { UserMediaItem } from '../Services/mediaServer.service';

@Component({
    selector: 'videoPlayer',
    templateUrl: './videoPlayer.component.html',
    styleUrls: ['./videoPlayer.component.less']
})
export class VideoPlayerComponent {
    constructor(private elRef: ElementRef) {
    }

    private _videoFileMediaItem: UserMediaItem | undefined;

    @Input("videoFileMediaItem")
    public set VideoFileMediaItem(value: UserMediaItem | undefined) {
        this._videoFileMediaItem = value;
        if (value != null) {
            const player = this.elRef.nativeElement.querySelector('video');
            player.load();
            player.src = "/mediaServer/streamingService?UniqueKey=" + this._videoFileMediaItem?.UniqueKey;
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
