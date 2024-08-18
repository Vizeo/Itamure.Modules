import { Component, ElementRef, ViewChild } from '@angular/core';
import { CastService, Receiver } from './Services/castService.service';
import { Access, MediaService } from './Services/mediaServer.service';
import { Router } from '@angular/router';

@Component({
    selector: 'mediaServerApp',
    templateUrl: './mediaServerApp.component.html',
    styleUrls: ['./mediaServerApp.component.less']
})
export class MediaServerAppComponent {
    constructor(private castService: CastService,
        private router: Router,
        mediaService: MediaService) {
        mediaService.GetAccess().then(a => this.Access = a);

        this.ShowInstallApp = !(window.matchMedia('(display-mode: standalone)').matches ||
            (<any>window.navigator).standalone ||
                document.referrer.includes('android-app://'));

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState == "hidden") {
                this._wasHidden = true;
            }
            else if (this._wasHidden == true &&
                localStorage.getItem("installId") != null) {
                //It it was hidden it should require a login again
                this.router.navigate(['/', 'pwa', 'Start']);
            }
        });
    }

    public SelectedMenuItem: string = "Movies";
    public Receivers: Receiver[] | null = null;
    public Access?: Access;
    public ShowInstallApp: boolean = false;    

    private _wasHidden: boolean = false;

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

    public NavigateToInstall() {
        window.top!.location.href = `${window.location.protocol}//${window.location.hostname}/mediaServer/Install`; 
    }
}
