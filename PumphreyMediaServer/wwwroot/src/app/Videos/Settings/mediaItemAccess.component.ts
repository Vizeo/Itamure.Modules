import { Component, Input } from '@angular/core';
import { MediaService, MediaItem, UserAccess } from '../../Services/mediaServer.service';
import { IEditableObject } from '../../../../../../../../../../../Source Code/SharedAngular/dist/interlink';

@Component({
	selector: 'mediaItemAccess',
	templateUrl: './mediaItemAccess.component.html',
	styleUrls: ['./mediaItemAccess.component.less']
})
export class MediaItemAccessComponent {
	constructor(private mediaService: MediaService) {
	}

	private _mediaItem: (MediaItem & IEditableObject) | undefined;

	public UserAccess: UserAccess[] | undefined;

	@Input("mediaItem")
	public set MediaItem(val: (MediaItem & IEditableObject) | undefined) {
		this._mediaItem = val;
		this.GetUserAccess();
	}
	public get MediaItem(): (MediaItem & IEditableObject) | undefined {
		return this._mediaItem;
	}

	private async GetUserAccess() {
		this.UserAccess = await this.mediaService.GetMediaItemAccess(this._mediaItem!.Id!);
		if (this.UserAccess.length == 0) {
			alert("Module cannot access user list. Please allow \"Get User List\" in modules.");
		}
	}

	public async UpdateAccess() {
		let usersAccess = this.UserAccess!
			.filter(a => a.Allowed)
			.map(a => a.UserId!);

		await this.mediaService.UpdateMediaItemAccess(this._mediaItem!.Id!, this._mediaItem!.Restricted!, usersAccess)
		this._mediaItem!.CommitChanges();
	}
}
