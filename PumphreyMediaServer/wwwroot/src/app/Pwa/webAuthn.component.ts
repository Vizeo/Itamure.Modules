import { Component } from '@angular/core';
import { WebAuthnService } from '../Services/webAuthn.service';

@Component({
	selector: 'webAuthn',
	templateUrl: './webAuthn.component.html',
	styleUrls: ['./webAuthn.component.less']
})
export class WebAuthnComponent {
	constructor(private webAuthService: WebAuthnService) {
		//this.RegisterAuthentication();
		this.ValidateAuthentication();
	}

	private _challenge?: string | null; //Only for registering

	private async ValidateAuthentication() {
		let userName = localStorage.getItem("MediaServerUserName");
		alert(localStorage.getItem("MediaServerUserName"));
		let assertOptionsJson = await this.webAuthService.GetAssertionOptions(userName);
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
		} catch (err) {
			/*showErrorAlert(err.message ? err.message : err);*/
		}

		try {
			await this.VerifyAssertionWithServer(credential);
		} catch (e) {
			alert("Could not verify assertion. " + e);
		}
	}

	private async RegisterAuthentication() {
		//This will be replaced by a button
		this._challenge = await this.webAuthService.GetChallenge("Ths code");
		await this.GetCredentialOptions();
	}

	private async GetCredentialOptions() {
		let optionsJson = await this.webAuthService.GetCredentialOptions(this._challenge!);
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

		let newCredential;
		try {
			newCredential = await navigator.credentials.create({
				publicKey: options
			});
		} catch (e) {
			var msg = "Could not create credentials in browser. Probably because the username is already registered with your authenticator. Please change username or authenticator."
			console.error(msg, e);
			alert(msg);
		}

		try {
			await this.RegisterNewCredential(newCredential);
			localStorage.setItem("MediaServerUserName", options.user.name);
			alert(options.user.name);
		} catch (err) {
			console.error(err);
			alert(err);
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
			let res = await this.webAuthService.MakeAssertion(json)
			//let res = await fetch("/makeAssertion", {
			//	method: 'POST', // or 'PUT'
			//	body: JSON.stringify(data), // data can be `string` or {object}!
			//	headers: {
			//		'Accept': 'application/json',
			//		'Content-Type': 'application/json'
			//	}
			//});

			//response = await res.json();
		} catch (e) {
			alert("Request to server failed " + e);
			throw e;
		}

		console.log("Assertion Object", response);

		alert("Dunzo");
		// show error
		//if (response.status !== "ok") {
		//	console.log("Error doing assertion");
		//	console.log(response.errorMessage);
		//	showErrorAlert(response.errorMessage);
		//	return;
		//}

		// show success message
		//await Swal.fire({
		//	title: 'Logged In!',
		//	text: 'You\'re logged in successfully.',
		//	type: 'success',
		//	timer: 2000
		//});



		// redirect to dashboard to show keys
		//window.location.href = "/dashboard/" + value("#login-username");
	}

	private async RegisterNewCredential(newCredential: any) {
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
			await this.webAuthService.SaveCredential(JSON.stringify(data))
		} catch (e) {
			console.log(e);
			alert(e);
		}

		alert("Registration Successful");

		// redirect to dashboard?
		//window.location.href = "/dashboard/" + state.user.displayName;
	}

	////////////////////////////////////////////////

	//private Test() {
	//	this.user
	//}

	////////////////////////////////////////////////
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
		thing = thing.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");

		return thing;
	};
}
