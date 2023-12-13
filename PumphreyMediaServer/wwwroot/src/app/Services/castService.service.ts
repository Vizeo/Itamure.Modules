//https://developers.google.com/cast/docs/web_sender/integrate
//https://developers.google.com/cast
import { ApplicationRef, EventEmitter, Injectable } from "@angular/core";
import { MediaReceiver, MediaService, UserMediaItem } from "./mediaServer.service";

declare const castAvailable: boolean;
declare const cast: any;
declare const chrome: any;

@Injectable({ providedIn: 'root' })
export class CastService {
	constructor(private appRef: ApplicationRef,
		private mediaService: MediaService) {
		if (this.CastSupported) {
			this._context = cast.framework.CastContext.getInstance();

			this._context.addEventListener(
				cast.framework.CastContextEventType.CAST_STATE_CHANGED, (e: any) => {
					if (this.IsConnected) {
						this.SetupPlayer();
					}
					this.ConnectionChanged.emit(this.IsConnected);
					this.appRef.tick();
			});

			if (this.IsConnected) {
				this.SetupPlayer();
			}
		}

		this._receivers = new Array<IReceiver>();
		this.GetReceivers();

		window.addEventListener("MediaServer.ReceiverUpdate", (u) => {
			let receiverId = (<CustomEvent>u).detail.ReceiverId;
			let existing = this._receivers.find(n => n.Id == receiverId);

			console.log("Received event", (<CustomEvent>u).detail, existing);
		});

		window.addEventListener("MediaServer.ReceiverAdded", (u) => {
			let receiver: MediaReceiver = (<CustomEvent>u).detail.Receiver;
			let existing = this._receivers.find(n => n.Id == receiver.Id);
			if (existing == null) {
				this.AddReceiver(receiver);
				console.log("Added", receiver.Name);
			}
		});

		window.addEventListener("MediaServer.ReceiverRemoved", (u) => {
			let receiverId = (<CustomEvent>u).detail.ReceiverId;
			let existingIndex = this._receivers.findIndex(n => n.Id == receiverId);
			if (existingIndex != -1) {
				this._receivers.splice(existingIndex, 1);
				console.log("Removed");
			}
		});
	}

	private SetupPlayer() {
		this._player = new cast.framework.RemotePlayer();
		this._playerController = new cast.framework.RemotePlayerController(this._player);

		this._playerController.addEventListener(
			cast.framework.RemotePlayerEventType.PLAYER_STATE_CHANGED, (event: any) => {
				this.PlayStatusChanged.emit(this.GetPlayerState(event.value));				
				this.appRef.tick();
			});
	}

	private _context: any;
	private _player: any;
	private _playerController: any;
	private _receivers: IReceiver[];

	//Old events to be moved
	public ConnectionChanged: EventEmitter<boolean> = new EventEmitter();
	public PlayStatusChanged: EventEmitter<PlayerState> = new EventEmitter();

	private GetPlayerState(val: string): PlayerState {
		switch (val) {
			case "IDLE":
				return PlayerState.Idle;
			case "PLAYING":
				return PlayerState.Playing;
			case "PAUSED":
				return PlayerState.Paused;
			case "BUFFERING":
				return PlayerState.Buffering;
		}
		throw "No way";
	}

	public get CastSupported(): boolean {
		return castAvailable;
	}

	public PlayOrPause() {
		this._playerController.playOrPause();
	}

	public Stop() {
		this._playerController.stop();
	}

	public get PlayerState(): PlayerState {
		if (this._player == null) {
			return PlayerState.Idle;
		}

		return this.GetPlayerState(this._player.playerState);
	}

	public Seek(progressPercent: number) {
		this._player.currentTime = this._playerController.getSeekTime(progressPercent, this._player.duration);
		this._playerController.seek();
	}

	public async PlayVideo(video: UserMediaItem) {
		let castSession = cast.framework.CastContext.getInstance().getCurrentSession();
		//var url = "https://www.w3schools.com/html/mov_bbb.mp4";
		//var url = "https://itamure.vizeotech.com/mediaServer/streamingService?mediaItemId=267";
		let url = location.origin + "/mediaServer/streamingService?UniqueKey=" + video.UniqueKey;
		let mimeType = video.MimeType;

		var mediaInfo = new chrome.cast.media.MediaInfo(url, "video/" + video.MimeType!.toLowerCase());
		mediaInfo.metadata = new chrome.cast.media.MovieMediaMetadata();
		mediaInfo.metadata.title = video.Name;
		var request = new chrome.cast.media.LoadRequest(mediaInfo);

		try {
			await castSession.loadMedia(request);
		} catch (e) {
			console.error(e);
		}
	}

	public get ReceiverName(): string {
		return cast.framework.CastContext.getInstance().getCurrentSession().getCastDevice().friendlyName;
	}

	public get Duration(): number {
		return this._player.duration;
	}

	public get CurrentTime(): number {
		return this._player.currentTime;
	}

	public get IsMediaLoaded(): boolean {
		return this._player.isMediaLoaded;
	}

	public get MediaTitle(): string {
		return this._player == null || this._player.title == null || this._player.title.length == 0 ? "None" : this._player.title;
	}

	///* 0 - 1*/
	//public SetVolume(level: number) {
	//	cast.framework.CastContext.getInstance().getCurrentSession().getSessionObj().setReceiverVolumeLevel(level);
	//}

	public get Receivers(): IReceiver[] {
		return this._receivers;
	}

	private async GetReceivers() {
		//Get from server
		let serverReceivers = await this.mediaService.GetMediaReceivers();
		serverReceivers.forEach(r => {
			this.AddReceiver(r);
		});

		//Get from google cast
	}

	private AddReceiver(mediaReceiver: MediaReceiver) {
		switch (mediaReceiver.ReceiverType) {
			case "Upnp":
				this.AddUpnpReceiver(mediaReceiver);
				break;
		}	
	}

	private AddUpnpReceiver(mediaReceiver: MediaReceiver) {
		var upnpReceiver = new UpnpReceiver(this.mediaService);
		upnpReceiver.Id = mediaReceiver.Id!;
		upnpReceiver.Name = mediaReceiver.Name!;
		this._receivers.push(upnpReceiver);
	}

	public get IsConnected(): boolean {
		return cast.framework.CastContext.getInstance().getCastState() == "CONNECTED";
	}

	public PlayOnReceiver(receiver: IReceiver, userMediaItem: UserMediaItem) {
		let upnpReceiver = <UpnpReceiver>receiver;
		this.mediaService.CastToUpnpReceivers(upnpReceiver.Id!, userMediaItem.UniqueKey!);
	}
}

export enum PlayerState {
	Idle = "IDLE",
	Playing = "PLAYING",
	Paused = "PAUSED",
	Buffering = "BUFFERING",
}

export interface IPlayer {
	PlayAndPause(): void;
	Stop(): void;
	get ReceiverName(): string;
	get MediaName(): string;

	//Add seak
	//Add Event For Updating Time
}

export interface IReceiver {
	get Id(): string;
	get Name(): string;
	get Player(): IPlayer | null;
}

class UpnpReceiver implements IReceiver {
	constructor(private mediaService: MediaService) {
	}

	public Id!: string;
	public Name!: string;
	public Player!: IPlayer;
}