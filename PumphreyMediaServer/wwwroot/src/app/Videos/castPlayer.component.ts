import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { VideoFileMediaItem } from '../Services/mediaServer.service';
import { CastService, PlayerState } from '../Services/castService.service';

@Component({
    selector: 'castPlayer',
    templateUrl: './castPlayer.component.html',
    styleUrls: ['./castPlayer.component.less']
})
export class CastPlayerComponent {
    constructor(private _castService: CastService) {
    }

    private _videoFileMediaItem: VideoFileMediaItem | undefined;
    public PlayerState = PlayerState;

    @Input("videoFileMediaItem")
    public set VideoFileMediaItem(value: VideoFileMediaItem | undefined) {
        this._videoFileMediaItem = value;
    }

    public Play() {
        if (this._castService.MediaTitle == "None") {
            this._castService.PlayVideo(this._videoFileMediaItem!);
        }
        else {
            this._castService.PlayOrPause();
        }
    }

    public get CurrentPlayerState(): PlayerState | null {
        return this._castService.PlayerState;
    }

    public get IsConnected(): boolean {
        return this._castService.IsConnected;
    }

    public Stop() {
        this._castService.Stop();
    }

    public SeekTest() {
        this._castService.Seek(50);
    }

    public get ReceiverName(): string {
        return this._castService.ReceiverName;
    }
    public get MediaName(): string {
        return this._castService.MediaTitle;
    }
}
