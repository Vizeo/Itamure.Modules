import { Component, ElementRef, Input, Renderer2, ViewChild } from '@angular/core';
import { CastService, Receiver } from '../Services/castService.service';
import { MediaService, UserMediaItem } from '../Services/mediaServer.service';

@Component({
    selector: 'remotePlayer',
    templateUrl: './remotePlayer.component.html',
    styleUrls: ['./remotePlayer.component.less']
})
export class RemotePlayerComponent {
    constructor(private renderer: Renderer2,
        private castService: CastService,
        private mediaService: MediaService) {
    }

    private _startPosition = 0;
    private _dragging = false;
    private _receiver?: Receiver;

    private _funcs: Function[] = new Array<Function>();

    @Input("enableControls")
    public EnableControls: boolean = true;

    @Input("receiver")
    public set Receiver(val: Receiver) {
        if (this._receiver == null) {
            this._receiver = val;
            val.Updated.subscribe(() => {
                if (this.Receiver.Status == "Playing" &&
                    !this._dragging &&
                    this._currentPosition!= null) {
                    this.Update();                    
                }
            });
        }
    }

    public ngAfterViewInit() {
        if (this.Receiver.MediaName != null &&
            this.Receiver.MediaName.length > 0) {
            this.Update();
        }
    }

    private Update() {
        let percent = this.Receiver.Position! / this.Receiver.Length!;
        let pos = this._progress.nativeElement.clientWidth * percent;
        this._currentPosition.nativeElement.style.left = pos + "px";

        this.Played = this.MakeTime(this.Receiver.Position!);
        this.Remaining = this.MakeTime(this.Receiver.Length! - this.Receiver.Position!);
    }

    private MakeTime(seconds: number): string {
        let minutes = Math.floor(seconds / 60);
        seconds %= 60;

        let hours = Math.floor(minutes / 60);
        minutes = minutes %= 60;

        let result = "";
        if (hours > 0) {
            if (hours < 10) {
                result += "0" + hours + ":";
            }
            else {
                result += hours + ":";
            }
        }
        else {
            result += "00:";
        }

        if (minutes > 0) {
            if (minutes < 10) {
                result += "0" + minutes + ":";
            }
            else {
                result += minutes + ":";
            }
        }
        else {
            result += "00:";
        }

        if (seconds > 0) {
            if (seconds < 10) {
                result += "0" + Math.floor(seconds);
            }
            else {
                result += Math.floor(seconds);
            }
        }
        else {
            result += "00";
        }

        return result;
    }

    public Played: string = "0";
    public Remaining: string = "0";
    public Receivers: Receiver[] | null = null;

    public get Receiver(): Receiver {
        return this._receiver!;
    }

    @ViewChild("currentPosition")
    private _currentPosition!: ElementRef<HTMLDialogElement>;

    @ViewChild("recastDevicesDialog")
    private _recastDevicesDialog!: ElementRef<HTMLDialogElement>;

    @ViewChild("progress")
    private _progress!: ElementRef<HTMLDialogElement>;

    public Position: number = 0;

    public Seek(event: MouseEvent) {
        if (this.EnableControls) {
            event.preventDefault();

            var rec = this._progress.nativeElement.getBoundingClientRect();
            this._startPosition = rec.x;
            this._dragging = true;

            this._funcs.push(this.renderer.listen('document', 'mousemove', e => {
                if (this._dragging) {
                    let position = e.clientX - this._startPosition;
                    if (position > 0 && position < this._progress.nativeElement.clientWidth) {
                        this._currentPosition.nativeElement.style.left = position + "px"
                    }
                }
            }));

            this._funcs.push(this.renderer.listen('document', 'mouseup', e => {
                if (this._dragging) {
                    let position = e.clientX - this._startPosition;
                    if (position < 0) {
                        position = 0;
                    }
                    if (position > this._progress.nativeElement.clientWidth) {
                        position = this._progress.nativeElement.clientWidth;
                    }
                    let percent = position / this._progress.nativeElement.clientWidth;
                    let seconds = this.Receiver!.Length! * percent;

                    this._funcs.forEach(f => f());
                    this._dragging = false;
                    this.Receiver!.Seek(seconds);
                }
            }));
        }
    }

    public PauseOrPlay() {
        this.Receiver!.PlayOrPause();
    }

    public Stop() {
        this.Receiver!.Stop();
    }

    public CloseRecastDevices() {
        this._recastDevicesDialog.nativeElement.close();
    }

    public Recast() {
        this.Receivers = this.castService.Receivers;
        this._recastDevicesDialog.nativeElement.showModal();
    }

    public async PlayVideoOnDevice(recastReceiver: Receiver) {
        var uniqueLink = this.Receiver.UniqueLink;
        let userMediaItem = await this.mediaService.GetUserMediaItem(uniqueLink!);
        if (userMediaItem != null) {
            await recastReceiver.Cast(userMediaItem, this.Receiver.Position!);
            this.Receiver.Stop();
            this.CloseRecastDevices();
        }
    }
}
