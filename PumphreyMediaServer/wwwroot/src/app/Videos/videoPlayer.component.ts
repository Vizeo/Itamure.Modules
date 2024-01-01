import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MediaService, UserMediaItem } from '../Services/mediaServer.service';

@Component({
    selector: 'videoPlayer',
    templateUrl: './videoPlayer.component.html',
    styleUrls: ['./videoPlayer.component.less']
})
export class VideoPlayerComponent {
    constructor(private mediaService: MediaService) {
    }

    @ViewChild("player")
    private _player!: ElementRef<HTMLVideoElement>;
    private _lastPostionUpdate: Date | null = null;

    private _videoFileMediaItem: UserMediaItem | undefined;

    @Input("videoFileMediaItem")
    public set VideoFileMediaItem(value: UserMediaItem | undefined) {
        this._videoFileMediaItem = value;
        if (value != null) {
            this._player.nativeElement.load();
            this._player.nativeElement.src = "/mediaServer/streamingService?UniqueKey=" + this._videoFileMediaItem?.UniqueKey;
        }
    }

    @Input("autoplay")
    public Autoplay: boolean = true;

    @Input("position")
    public Position: number = 0;

    public Play() {
        this._player.nativeElement.play();
    }

    public Stop() {
        this._player.nativeElement.pause();
    }

    public ReadyToPlay() {
        this._player.nativeElement.currentTime = this.Position;
        if (this.Autoplay) {
            this._player.nativeElement.play();
        }
    }

    public async PlayNext() {
        let next = await this.mediaService.GetSeriesNextRecent(this._videoFileMediaItem!.UniqueKey!);
        if (next != null) {
            this.Position = 0;
            this._videoFileMediaItem = next;
            this._player.nativeElement.load();
            this._player.nativeElement.src = "/mediaServer/streamingService?UniqueKey=" + this._videoFileMediaItem?.UniqueKey;
        }
    }

    public PositionChanged() {
        var date = new Date();
        date.setSeconds(date.getSeconds() - 1);
        if (this._lastPostionUpdate == null ||
            this._lastPostionUpdate < date) {

            this.mediaService.UpdateMediaPosition(this._videoFileMediaItem!.UniqueKey!, this._player.nativeElement.currentTime)

            this._lastPostionUpdate = new Date();
        }
    }
}
