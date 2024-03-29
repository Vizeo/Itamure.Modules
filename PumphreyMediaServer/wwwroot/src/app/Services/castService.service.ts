﻿//https://developers.google.com/cast/docs/web_sender/integrate
//https://developers.google.com/cast
//https://stackoverflow.com/questions/61041766/how-to-reconnect-join-an-existing-google-cast-session-from-chrome
import { ApplicationRef, EventEmitter, Injectable } from "@angular/core";
import { MediaReceiver, MediaService, UserMediaItem } from "./mediaServer.service";

declare const castAvailable: boolean;
declare const cast: any;
declare const chrome: any;

@Injectable({ providedIn: 'root' })
export class CastService {
	constructor(appRef: ApplicationRef,
		private mediaService: MediaService) {
		this._receivers = new Array<Receiver>();

		setTimeout(() => {
			if (castAvailable) {
				this._receivers.push(new ChromeCastReceiver(appRef, mediaService));
			}
			this.GetReceivers();
		});

		window.addEventListener("MediaServer.ReceiverUpdate", (u) => {
			let update = (<CustomEvent>u).detail;
			let receiverId = update.ReceiverId;
			let existing = this._receivers.find(n => n.Id == receiverId);
			if (existing != null) {
				existing.UserName = update.UserName;
				existing.MediaName = update.MediaName;
				existing.Status = update.Status;
				existing.Length = update.Length;
				existing.Position = update.Position;
				existing.UniqueLink = update.UniqueLink;
				existing.Updated.emit();
			}
		});

		window.addEventListener("MediaServer.ReceiverAdded", (u) => {
			let receiver: MediaReceiver = (<CustomEvent>u).detail.Receiver;
			let existing = this._receivers.find(n => n.Id == receiver.Id);
			if (existing == null) {
				this.AddReceiver(receiver);
			}
		});

		window.addEventListener("MediaServer.ReceiverRemoved", (u) => {
			let receiverId = (<CustomEvent>u).detail.ReceiverId;
			let existingIndex = this._receivers.findIndex(n => n.Id == receiverId);
			if (existingIndex != -1) {
				this._receivers.splice(existingIndex, 1);
			}
		});
	}

	private _receivers: Receiver[];
	public get Receivers(): Receiver[] {
		return this._receivers;
	}

	private async GetReceivers() {
		//Get from server
		let serverReceivers = await this.mediaService.GetMediaReceivers();	
		serverReceivers.forEach(r => {
			this.AddReceiver(r);
		});
	}

	private AddReceiver(mediaReceiver: MediaReceiver) {
		switch (mediaReceiver.ReceiverType) {
			case "Upnp":
				this.AddUpnpReceiver(mediaReceiver);
				break;
			case "Web":
				this.AddWebReceiver(mediaReceiver);
				break;
		}
	}

	private AddUpnpReceiver(mediaReceiver: MediaReceiver) {
		var upnpReceiver = new UpnpReceiver(this.mediaService);
		upnpReceiver.Id = mediaReceiver.Id!;
		upnpReceiver.Name = mediaReceiver.Name!;
		this._receivers.push(upnpReceiver);
	}

	private AddWebReceiver(mediaReceiver: MediaReceiver) {
		var upnpReceiver = new WebReceiver(this.mediaService);
		upnpReceiver.Id = mediaReceiver.Id!;
		upnpReceiver.Name = mediaReceiver.Name!;
		this._receivers.push(upnpReceiver);
	}

	public async PlayOnReceiver(receiver: Receiver, userMediaItem: UserMediaItem, position: number) {
		await receiver.Cast(userMediaItem, position);
	}
}

export abstract class Receiver {
	public abstract Cast(userMediaItem: UserMediaItem, position: number): Promise<void>;
	public abstract PlayOrPause(): void;
	public abstract Stop(): void;
	public abstract Seek(seconds: number): void;
	public Updated: EventEmitter<any> = new EventEmitter();

	public Id?: string;
	public Name?: string;
	public UserName?: string;
	public MediaName?: string;
	public Status?: string;
	public Length?: number;
	public Position?: number;
	public UniqueLink?: string;
}

class UpnpReceiver extends Receiver {
	constructor(private mediaService: MediaService) {
		super();
	}

	public override async Cast(userMediaItem: UserMediaItem, position: number): Promise<void> {
		await this.mediaService.CastToReceiver("Upnp", this.Id!, userMediaItem.UniqueKey!, position);
	}

	public override PlayOrPause(): void {
		if (this.Status == "Playing") {
			this.mediaService.PauseMediaReceiver(this.Id!, "Upnp");
		}
		else if (this.Status == "Paused") {
			this.mediaService.PlayMediaReceiver(this.Id!, "Upnp");
		}
	}

	public override Stop(): void {
		if (this.Status == "Playing" ||
			this.Status == "Paused") {
			this.mediaService.StopMediaReceiver(this.Id!, "Upnp");
		}
	}

	public override Seek(seconds: number): void {
		this.mediaService.SeekMediaReceiver(this.Id!, "Upnp", seconds);
	}
}

class WebReceiver extends Receiver {
	constructor(private mediaService: MediaService) {
		super();
	}

	public override async Cast(userMediaItem: UserMediaItem, position: number): Promise<void> {
		await this.mediaService.CastToReceiver("Web", this.Id!, userMediaItem.UniqueKey!, position);
	}

	public override PlayOrPause(): void {
		if (this.Status == "Playing") {
			this.mediaService.PauseMediaReceiver(this.Id!, "Web");
		}
		else if (this.Status == "Paused") {
			this.mediaService.PlayMediaReceiver(this.Id!, "Web");
		}
	}

	public override Stop(): void {
		if (this.Status == "Playing" ||
			this.Status == "Paused") {
			this.mediaService.StopMediaReceiver(this.Id!, "Web");
		}
	}

	public override Seek(seconds: number): void {
		this.mediaService.SeekMediaReceiver(this.Id!, "Web", seconds);
	}
}

class ChromeCastReceiver extends Receiver {
	constructor(private appRef: ApplicationRef,
		private mediaService: MediaService) {
		super();

		this.Name = "Chrome Cast";

		cast.framework.CastContext.getInstance().addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, (event: any) => {
			switch (event.sessionState) {
				case "SESSION_RESUMED":
				case "SESSION_STARTED":
					this.SetupPlayer();
					break;
				case "SESSION_ENDED":
					this.Name = "Chrome Cast";
					this._player = null;
					this._playerController = null;
					break;
			}
		});
	}

	private _player: any;
	private _playerController: any;
	private _url?: string;

	public override async Cast(userMediaItem: UserMediaItem, position: number): Promise<void> {
		let url = location.origin + "/mediaServer/streamingService?UniqueKey=" + userMediaItem.UniqueKey;

		//Cannot run on local host so set to local ip
		url = url.replace("localhost", "192.168.1.234");

		let mimeType = userMediaItem.MimeType;
		var mediaInfo = new chrome.cast.media.MediaInfo(url, mimeType);
		mediaInfo.metadata = new chrome.cast.media.MovieMediaMetadata();
		mediaInfo.metadata.title = userMediaItem.Name;
		var request = new chrome.cast.media.LoadRequest(mediaInfo);
		try {
			let session = await this.CastSession();
			if (session != null) {
				await session.loadMedia(request);
				this.MediaName = userMediaItem.Name!;
				this.SetupPlayer();
				if (position > 0) {
					this.Seek(position);
				}
			}
		} catch (e) {
			console.error(e);
		}
	}

	private async CastSession(): Promise<any> {
		let castSession = cast.framework.CastContext.getInstance().getCurrentSession();
		if (!castSession) {
			let requestSession = await cast.framework.CastContext.getInstance().requestSession();

			if (requestSession == null) {
				castSession = cast.framework.CastContext.getInstance().getCurrentSession();
			}
		}
		return castSession;
	}

	private SetStatus(val: string) {
		switch (val) {
			case "IDLE":
				this.Status = "Stopped";
				this.MediaName = undefined;
				break;
			case "PLAYING":
			case "BUFFERING":
				this.Status = "Playing";
				this.MediaName = this._player.title;
				this.Length = Number(this._player.duration);
				break;
			case "PAUSED":
				this.Status = "Paused";
				break;
		}
	}

	private SetupPlayer() {
		this._player = new cast.framework.RemotePlayer();
		this._playerController = new cast.framework.RemotePlayerController(this._player);
		this.Name = "Chrome Cast - " + cast.framework.CastContext.getInstance().getCurrentSession().getCastDevice().friendlyName;
		this.MediaName = this._player.title;

		this._playerController.addEventListener(
			cast.framework.RemotePlayerEventType.PLAYER_STATE_CHANGED, (event: any) => {
				this.SetStatus(event.value);
				this.appRef.tick();
			});

		this._playerController.addEventListener(
			cast.framework.RemotePlayerEventType.CURRENT_TIME_CHANGED, (event: any) => {
				this.Position = Number(event.value);

				this._url = <string>this._player.mediaInfo.contentId;
				let uniqueKeyIndex = this._url.lastIndexOf("UniqueKey=");
				if (uniqueKeyIndex != -1) {
					uniqueKeyIndex += 10;
					this.UniqueLink = this._url.substring(uniqueKeyIndex, uniqueKeyIndex + 36);
					this.mediaService.UpdateMediaPosition(this.UniqueLink, this.Position)
					this.Updated.emit();
					this.appRef.tick();
				}
			});

		this.SetStatus(this._player.playerState);
	}

	public override PlayOrPause(): void {
		this._playerController.playOrPause();
	}

	public override Stop(): void {
		this._playerController.stop();
	}

	public override Seek(seconds: number): void {
		//Convert to percentage
		let percent = (seconds / this.Length!) * 100;
		this._player.currentTime = this._playerController.getSeekTime(percent, this._player.duration);
		this._playerController.seek();
	}
}
