import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';

@Component({
	selector: 'remoteWebScreen',
	templateUrl: './remoteWebScreen.component.html',
	styleUrls: ['./remoteWebScreen.component.less']
})
export class RemoteWebScreenComponent {
	constructor() {
	}

	private _webSocket: WebSocket | null = null;
	private _lastPostionUpdate: Date | null = null;
	private _startPosition: number | null = null;

	public ngAfterViewInit() {
		this.Connect();
	}

	@ViewChild("video")
	private _video!: ElementRef<HTMLVideoElement>;

	private Connect() {
		var url = new URL(window.location.href);
		var screen = url.searchParams.get("screen");

		let host: string;
		if (window.location.protocol == "https:") {
			host = "wss";
		}
		else {
			host = "ws";
		}

		host = host + "://" + window.location.hostname;

		if (window.location.port.length > 0) {
			host = host + ":" + window.location.port;
		}

		host = host + "/mediaServer/api/mediaServerService/WebScreenRemote?screen=" + screen;

		this._webSocket = new WebSocket(host);
		this._webSocket.onopen = (event) => {
			this.Send({ State: "Ready" });
		}

		this._webSocket.onmessage = (message) => {
			console.log("Message recieved", message.data);
			var data = JSON.parse(message.data);
			switch ((<ICommand>data).State) {
				case "Load":
					this.Load(<LoadCommand>data);
					break;
				case "Play":
					this.Play();
					break;
				case "Pause":
					this.Pause();
					break;
				case "Stop":
					this.Stop();
					break;
				case "Seek":
					this.Seek(<SeekCommand>data);
					break;
			}
		}

		this._webSocket.onclose = (closeEvent) => {
			this.Stop();
		}

		this._webSocket.onerror = (errorEvent) => {
			console.log(errorEvent);
		}
	}

	private Load(playCommand: LoadCommand) {
		(<any>window).maximizeWindow();
		this._video.nativeElement.load();
		this._video.nativeElement.src = "/mediaServer/streamingService?UniqueKey=" + playCommand.UniqueLink;
		this._startPosition = playCommand.Position;
	}

	public VideoLoaded() {
		if (this._startPosition != null &&
			this._startPosition > 0) {
			this._video.nativeElement.currentTime = this._startPosition;
			this._startPosition = null;
		}

		this._video.nativeElement.play();
	}

	private Play() {
		this._video.nativeElement.play();
	}

	private Pause() {
		this._video.nativeElement.pause();
	}

	private Seek(seekCommand: SeekCommand) {
		this._video.nativeElement.currentTime = seekCommand.Position;
	}

	private Stop() {
		(<any>window).closeWindow();
	}

	public StatusChange(status: string) {
		this.Send({ State: status });
	}

	public PositionChanged() {
		var date = new Date();
		date.setSeconds(date.getSeconds() - 1);
		if (this._lastPostionUpdate == null ||
			this._lastPostionUpdate < date) {
			let positionUpdate = new PositionUpdate();
			positionUpdate.State = "Position";
			positionUpdate.Position = this._video.nativeElement.currentTime;
			this.Send(positionUpdate);
			this._lastPostionUpdate = new Date();
		}
	}

	public Send(update: Update) {
		var json = JSON.stringify(update);
		this._webSocket?.send(json);
	}

	@HostListener('window:unload')
	public NotifyStop() {
		let termindatedUpdate = new Update();
		termindatedUpdate.State = "Terminated";
		this.Send(termindatedUpdate);
	}
}

interface ICommand {
	State: string;
}

class LoadCommand implements ICommand {
	public State!: string;
	public UniqueLink!: string;
	public Position!: number;
}

class SeekCommand implements ICommand {
	public State!: string;
	public Position!: number;
}

class Update {
	public State!: string;
}

class PositionUpdate extends Update {
	public Position!: number;
}