import { Component } from '@angular/core';
import { WebAuthnService } from '../Services/webAuthn.service';

@Component({
    selector: 'generateAuthCode',
    templateUrl: './generateAuthCode.component.html',
    styleUrls: ['./generateAuthCode.component.less']
})
export class GenerateAuthCodeComponent {
    constructor(private webAuthnService: WebAuthnService) {
        this.GetCode();
    }

    public Code: string | null = null;

    private async GetCode() {
        //this.Code = await this.webAuthService.GenerateAuthCode();
    }
}
