import { Component } from '@angular/core';
import { WebAuthnService } from '../Services/webAuthn.service';
import { Router } from '@angular/router';

@Component({
    selector: 'webAppInstall',
    templateUrl: './webAppInstall.component.html',
    styleUrls: ['./webAppInstall.component.less']
})
export class WebAppInstallComponent {
    constructor(private router: Router) {
        // This variable will save the event for later use.
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevents the default mini-infobar or install dialog from appearing on mobile
            e.preventDefault();
            // Save the event because you'll need to trigger it later.
            this._deferredPrompt = e;
            this.CanInstall = true;
        });

        addEventListener("appinstalled", (event) => { this.router.navigate(['/pwa/Start']) });

        const mqStandAlone = '(display-mode: standalone)';
        if ((<any>navigator).standalone || window.matchMedia(mqStandAlone).matches) {
            this.router.navigate(['/pwa/Start'])
        }
    }

    private _deferredPrompt: any;

    public CanInstall: boolean = false;
    public Address: string = window.location.href;

    public Install() {
        this._deferredPrompt.prompt();
    }

    public Navigate() {
        location.href = this.Address;
    }
}
