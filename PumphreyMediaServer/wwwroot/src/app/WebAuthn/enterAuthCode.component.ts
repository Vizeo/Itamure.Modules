import { Component } from '@angular/core';
import { WebAuthnService } from '../Services/webAuthn.service';

@Component({
    selector: 'enterAuthCode',
    templateUrl: './enterAuthCode.component.html',
    styleUrls: ['./enterAuthCode.component.less']
})
export class EnterAuthCodeComponent {
    constructor(private webAuthnService: WebAuthnService) {
    }

    public Code: string | null = null;
    public Response: string | null = null;

    public async ProcessAuthentication() {
        //this.Response = await this.webAuthnService.AuthenticateCode(this.Code);
    }
}
