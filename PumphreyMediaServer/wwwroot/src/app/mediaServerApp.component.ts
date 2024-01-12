import { Component, ElementRef, ViewChild } from '@angular/core';
import { CastService, Receiver } from './Services/castService.service';
import { Access, MediaService } from './Services/mediaServer.service';

@Component({
    selector: 'mediaServerApp',
    templateUrl: './mediaServerApp.component.html',
    styleUrls: ['./mediaServerApp.component.less']
})
export class MediaServerAppComponent {
    constructor(private castService: CastService, mediaService: MediaService) {
        mediaService.GetAccess().then(a => this.Access = a);
    }

    public SelectedMenuItem: string = "Movies";
    public Receivers: Receiver[] | null = null;
    public Access?: Access;

    @ViewChild("castDevicesDialog")
    private _castDevicesDialog!: ElementRef<HTMLDialogElement>;

    public SelectMenuItem(name: string) {
        this.SelectedMenuItem = name;
    }

    public async ShowCastDevices() {
        this.Receivers = this.castService.Receivers;
        this._castDevicesDialog.nativeElement.showModal();
    }

    public CloseCastDevices() {
        this._castDevicesDialog.nativeElement.close();
    }
}
