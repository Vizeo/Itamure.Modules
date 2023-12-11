//https://developers.google.com/cast/docs/web_sender/integrate
//https://developers.google.com/cast
import { ApplicationRef, EventEmitter, Injectable } from "@angular/core";
import { MediaService, UserMediaItem } from "./mediaServer.service";

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

	public ConnectionChanged: EventEmitter<boolean> = new EventEmitter();
	public PlayStatusChanged: EventEmitter<PlayerState> = new EventEmitter();
	//public TimeChanged: EventEmitter<number> = new EventEmitter(); //TODO: Implement this with a timer

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

	public async GetReceivers(): Promise<IReceiver[]> {
		let result = new Array<IReceiver>();

		//Get from server
		let serverReceivers = await this.mediaService.GetUpnpMediaReceivers();
		serverReceivers.forEach(r => {
			let receiver = new UpnpReceiver(this.mediaService);
			receiver.Id = r.Id!;
			receiver.Name = r.Name!;

			//Add player 

			result.push(receiver);
		});

		//Get from google cast

		return result;
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
	get Name(): string;
	get Player(): IPlayer | null;
}

class UpnpReceiver implements IReceiver {
	constructor(private mediaService: MediaService) {
	}

	public Id?: string;
	public Name!: string;
	public Player!: IPlayer;
}