import { SwUpdate } from '@angular/service-worker';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { WebAuthnService } from '../Services/webAuthn.service';
import { Router } from '@angular/router';

declare var BarcodeDetector: any;

@Component({
	selector: 'start',
	templateUrl: './start.component.html',
	styleUrls: ['./start.component.less']
})
export class StartComponent {
	constructor(private webAuthnService: WebAuthnService,
		private router: Router,
		private swUpdate: SwUpdate) {

		this.WaitMessage = "Checking for updates";
		this.swUpdate.checkForUpdate().then(t => {
			if (t) {
				alert("Your app has been updated");
				location.reload();
			}
			else {
				this._waitSpinner.nativeElement.close();
				this.RunApp();
			}
		})

		//this.SetupBarcode();
	}

	ngAfterViewInit() {
		this._waitSpinner.nativeElement.showModal();
	}

	@ViewChild("waitSpinner")
	private _waitSpinner!: ElementRef<HTMLDialogElement>;

	private readonly INSTALL_ID: string = "installId";

	private _installId: string | null = localStorage.getItem(this.INSTALL_ID);
	private _challenge: string | null = null;

	public CurrentStartState: StartState = StartState.CheckingForUpdates;
	public StartState = StartState;
	public Address: string = window.location.origin + "/accessCode";
	public LoginCode: string | null = null;
	public CanScan: boolean = false;
	public WaitMessage: string | null = null;

	public Navigate() {
		location.href = this.Address;
	}

	private RunApp() {
		///*
		//1. If install id is null generate a new one but don't save it yet.
		//    a. Set login required to true
		//    b. Get the challange
		//    c. GetCredentialOptions from server
		//    d. RegisterNewCredential
		//    e. Store UserName and InstallId in localstorage
		//    f. Navigat to main page

		//1. GetAssertionOptions using InstallId
		//    a. If assution options fails go to 1
		//    b. VerifyAssertionWithServer
		//    c. Navigate to main page
		//*/
		if (this._installId == null) {
			this.CurrentStartState = StartState.RequestingAuthentication;
			this.RegisterInstall();
		}
		else {
			this.CurrentStartState = StartState.Authenticating;
			this.Authenticate();
		}
	}

	private SetupBarcode() {
		if (!("BarcodeDetector" in globalThis)) {
			console.log("Barcode Detector is not supported by this browser.");
		} else {
			console.log("Barcode Detector supported!");
			this.CanScan = true;
			// create new detector
			const barcodeDetector = new BarcodeDetector({
				formats: ["qr_code"],
			});
		}
	}

	public async RegisterInstall() {
		this._installId = this.CreateInstallId();
	}

	public async Authenticate() {
		let credentials = await this.GetAuthenticationOptions();
		if (credentials != null) {			
			this.VerifyAssertionWithServer(credentials);
			this.RouteToMainPage();
		}
	}

	private RouteToMainPage() {
		this.router.navigate(['/']);
	}

	private async GetAuthenticationOptions(): Promise<any> {
		let assertOptionsJson = await this.webAuthnService.GetAssertionOptions(this._installId);
		let assertOptions = JSON.parse(assertOptionsJson!);

		if (assertOptions.status !== "ok") {
			console.log("Error creating assertion options");
			console.log(assertOptions.errorMessage);
			alert(assertOptions.errorMessage);
			return;
		}

		const challenge = assertOptions.challenge.replace(/-/g, "+").replace(/_/g, "/");
		assertOptions.challenge = Uint8Array.from(atob(challenge), c => c.charCodeAt(0));

		// fix escaping. Change this to coerce
		for (let i = 0; i < assertOptions.allowCredentials.length; i++) {
			let credential = assertOptions.allowCredentials[i];
			let fixedId = credential.id.replace(/\_/g, "/").replace(/\-/g, "+");
			credential.id = Uint8Array.from(atob(fixedId), c => c.charCodeAt(0));
		}

		console.log("Assertion options", assertOptions);

		// ask browser for credentials (browser will ask connected authenticators)
		let credential;
		try {
			credential = await navigator.credentials.get({ publicKey: assertOptions })
			return credential;
		} catch (err) {
			/*showErrorAlert(err.message ? err.message : err);*/
			return null;
		}
	}

	private async VerifyAssertionWithServer(assertedCredential: any) {
		// Move data into Arrays incase it is super long
		let authData = new Uint8Array(assertedCredential.response.authenticatorData);
		let clientDataJSON = new Uint8Array(assertedCredential.response.clientDataJSON);
		let rawId = new Uint8Array(assertedCredential.rawId);
		let sig = new Uint8Array(assertedCredential.response.signature);
		const data = {
			id: assertedCredential.id,
			rawId: this.CoerceToBase64Url(rawId),
			type: assertedCredential.type,
			extensions: assertedCredential.getClientExtensionResults(),
			response: {
				authenticatorData: this.CoerceToBase64Url(authData),
				clientDataJSON: this.CoerceToBase64Url(clientDataJSON),
				signature: this.CoerceToBase64Url(sig)
			}
		};

		let response;
		try {
			let json = JSON.stringify(data);
			this.ShowWaitMessage("Authenticating");
			let res = await this.webAuthnService.MakeAssertion(json)
			this.HideWaitMessage();
		} catch (e) {
			alert("Request to server failed " + e);
			throw e;
		}

		console.log("Assertion Object", response);
	}

	private ShowWaitMessage(message: string) {
		this.WaitMessage = message;
		this._waitSpinner.nativeElement.showModal();
	}

	private HideWaitMessage() {
		this._waitSpinner.nativeElement.close();
	}

	public async RegisterAuthentication() {
		this.ShowWaitMessage("Validating login code.");
		let createTokenResult = await this.webAuthnService.CreateToken(this.LoginCode, this._installId);
		if (!createTokenResult.Success) {
			this.HideWaitMessage();
			alert(createTokenResult.FailureMessage);
		}
		else {
			this.ShowWaitMessage("Creating credentials.");
			let credentials = await this.CreateNewLogin();
			if (credentials != null) {
				if (await this.RegisterNewCredential(credentials)) {
					localStorage.setItem(this.INSTALL_ID, this._installId!);

					this.HideWaitMessage();
					this.RouteToMainPage();
				}
			}
		}
	}

	private async CreateNewLogin(): Promise<any> {
		this._challenge = await this.webAuthnService.GetChallenge(this._installId);
		let optionsJson = await this.webAuthnService.GetCredentialOptions(this._challenge);
		let options = JSON.parse(optionsJson!);

		options.challenge = this.CoerceToArrayBuffer(options.challenge);
		// Turn ID into a UInt8Array Buffer for some reason
		options.user.id = this.CoerceToArrayBuffer(options.user.id);

		options.excludeCredentials = options.excludeCredentials.map((c: any) => {
			c.id = this.CoerceToArrayBuffer(c.id);
			return c;
		});

		if (options.authenticatorSelection.authenticatorAttachment === null) {
			options.authenticatorSelection.authenticatorAttachment = undefined;
		}

		try {
			let newCredential = await navigator.credentials.create({
				publicKey: options
			});
			return newCredential;
		} catch (e) {
			var msg = "Could not create credentials"
			console.error(msg, e);
			alert(msg);
			return null;
		}
	}

	private async RegisterNewCredential(newCredential: any): Promise<boolean> {
		// Move data into Arrays incase it is super long
		let attestationObject = new Uint8Array(newCredential.response.attestationObject);
		let clientDataJSON = new Uint8Array(newCredential.response.clientDataJSON);
		let rawId = new Uint8Array(newCredential.rawId);

		const data = {
			id: newCredential.id,
			rawId: this.CoerceToBase64Url(rawId),
			type: newCredential.type,
			extensions: newCredential.getClientExtensionResults(),
			response: {
				attestationObject: this.CoerceToBase64Url(attestationObject),
				clientDataJSON: this.CoerceToBase64Url(clientDataJSON),
				transports: newCredential.response.getTransports()
			},
		};

		try {
			let saveCredentailsResult = await this.webAuthnService.SaveCredential(JSON.stringify(data));
			if (saveCredentailsResult.Success) {
				return true;
			}
			else {
				alert(saveCredentailsResult.FailureMessage);
			}
		} catch (e) {
			console.log(e);
			alert(e);
		}
		return false;
	}

	//Helper functions
	private CreateInstallId() {
		return Math.random().toString(36).slice(2);
	}

	private CoerceToArrayBuffer(thing: any) {
		if (typeof thing === "string") {
			// base64url to base64
			thing = thing.replace(/-/g, "+").replace(/_/g, "/");

			// base64 to Uint8Array
			var str = window.atob(thing);
			var bytes = new Uint8Array(str.length);
			for (var i = 0; i < str.length; i++) {
				bytes[i] = str.charCodeAt(i);
			}
			thing = bytes;
		}

		// Array to Uint8Array
		if (Array.isArray(thing)) {
			thing = new Uint8Array(thing);
		}

		// Uint8Array to ArrayBuffer
		if (thing instanceof Uint8Array) {
			thing = thing.buffer;
		}

		// error if none of the above worked
		if (!(thing instanceof ArrayBuffer)) {
			throw new TypeError("could not coerce to ArrayBuffer");
		}

		return thing;
	};

	private CoerceToBase64Url(thing: any) {
		// Array or ArrayBuffer to Uint8Array
		if (Array.isArray(thing)) {
			thing = Uint8Array.from(thing);
		}

		if (thing instanceof ArrayBuffer) {
			thing = new Uint8Array(thing);
		}

		// Uint8Array to base64
		if (thing instanceof Uint8Array) {
			var str = "";
			var len = thing.byteLength;

			for (var i = 0; i < len; i++) {
				str += String.fromCharCode(thing[i]);
			}
			thing = window.btoa(str);
		}

		if (typeof thing !== "string") {
			throw new Error("could not coerce to string");
		}

		// base64 to base64url
		// NOTE: "=" at the end of challenge is optional, strip it off here
		return thing.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");
	};
}

enum StartState {
	CheckingForUpdates,
	RequestingAuthentication,
	Authenticating
}