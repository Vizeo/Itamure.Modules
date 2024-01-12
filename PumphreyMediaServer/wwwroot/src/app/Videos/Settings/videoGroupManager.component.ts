import { Component, ElementRef, ViewChild } from '@angular/core';
import { MediaService, MovieGroupingType, VideoGroup } from '../../Services/mediaServer.service';
import { GlobalService, GroupValidatorBaseDirective, IEditableObject, SortChangeEvent, ItemLocationChangeEvent } from 'interLink';

@Component({
	selector: 'videoGroupManager.component',
	templateUrl: './videoGroupManager.component.html',
	styleUrls: ['./videoGroupManager.component.less']
})
export class VideoGroupManagerComponent {
	constructor(private mediaService: MediaService,
		private globalService: GlobalService) {
		this.GetVideoGroups();
	}

	private _videoGroups: VideoGroup[] | null = null;
	public MovieGroupingType = MovieGroupingType;
	public SortedGroups: VideoGroup[] | null = null;
	public RandomGroups: VideoGroup[] | null = null;
	public EditingVideoGroup: (VideoGroup & IEditableObject) | null = null;

	@ViewChild("videoGroupSetup")
	private _videoGroupSetup!: ElementRef<HTMLDialogElement>; 

	private async GetVideoGroups() {
		this._videoGroups = await this.mediaService.GetVideoGroups();

		this.SortedGroups = this._videoGroups
			.filter(a => a.Order != null)
			.sort((a, b) => {
				if (a!.Order! < b!.Order!) return -1;
				if (a!.Order! > b!.Order!) return 1;
				return 0;
			});
		this.RandomGroups = this._videoGroups.filter(a => a.Order == null);
	}

	public GetMovieGroupingTypeName(movieGroupingType: MovieGroupingType) {
		return MovieGroupingType[movieGroupingType].split(/(?=[A-Z])/).join(" ");
	}

	private UpdateSorted() {
		//Update indexes
		var updatedList = new Array<VideoGroup>();

		for (let i = 0; i < this.SortedGroups!.length; i++) {
			let videoGroup = this.SortedGroups![i];
			if (videoGroup.Order != i) {
				videoGroup.Order = i;
				updatedList.push(videoGroup);
			}			
		}

		//Send updates
		this.mediaService.UpdateVideoGroups(updatedList);
	}

	public UpdateVideoGroup(videoGroup: VideoGroup) {
		if (GroupValidatorBaseDirective.IsValid("videoGroup")) {
			this.mediaService.UpdateVideoGroups([videoGroup]);
		}
	}

	public SortChange(event: SortChangeEvent) {
		this.SortedGroups!.splice(event.OldIndex, 1);
		this.SortedGroups!.splice(event.NewIndex, 0, event.Item);

		this.UpdateSorted();
	}

	public SortRemoved(event: ItemLocationChangeEvent) {
		this.SortedGroups!.splice(event.Index, 1);
		this.UpdateSorted();
	}

	public SortAdded(event: ItemLocationChangeEvent) {
		this.SortedGroups!.splice(event.Index, 0, event.Item);
		this.UpdateSorted();
	}

	public RandomRemoved(event: ItemLocationChangeEvent) {
		this.RandomGroups!.splice(event.Index, 1);
	}

	public RandomAdded(event: ItemLocationChangeEvent) {
		(<VideoGroup>event.Item).Order = undefined;
		this.RandomGroups!.splice(event.Index, 0, event.Item);
		this.mediaService.UpdateVideoGroups([event.Item]);
	}

	public DeleteVideoGroup(videoGroup: VideoGroup) {
		if (confirm("Remove video group " + videoGroup.Name)) {
			let list: VideoGroup[];
			if (videoGroup.Order != null) {
				list = this.SortedGroups!;
			}
			else {
				list = this.RandomGroups!;
			}

			let index = list.indexOf(videoGroup);
			list.splice(index, 1);

			this.mediaService.DeleteVideoGroup(videoGroup);
		}
	}

	public ShowVideoGroupSetup(videoGroup: VideoGroup) {
		this.EditingVideoGroup = this.globalService.CreateProxy(videoGroup);
		this._videoGroupSetup.nativeElement.showModal();
	}

	public async SaveVideGroupSetup() {
		this.EditingVideoGroup?.CommitChanges();
		if (this.EditingVideoGroup!.Id != null) {
			this.mediaService.UpdateVideoGroups([this.EditingVideoGroup?.TargetObject]);
		}
		else {
			let newVidoGroup = await this.mediaService.AddVideoGroup(this.EditingVideoGroup?.TargetObject);
			this.EditingVideoGroup!.TargetObject.Id = newVidoGroup.Id;
		}
		this.EditingVideoGroup = null;
		this._videoGroupSetup.nativeElement.close();
	}

	public CancelVideGroupSetup() {
		if (this.EditingVideoGroup!.Id == null) {
			this.RandomGroups!.splice(0, 1);
		}	
			
		this._videoGroupSetup.nativeElement.close();
	}

	public CanSaveVideoGroupSetup(): boolean {
		return GroupValidatorBaseDirective.IsValid("videoGroupSetup")
	}

	public RequiresSetup(videoGroup: VideoGroup): boolean {
		return videoGroup.MovieGroupingType == MovieGroupingType.Folder ||
			videoGroup.MovieGroupingType == MovieGroupingType.Genres ||
			videoGroup.MovieGroupingType == MovieGroupingType.Range ||
			videoGroup.MovieGroupingType == MovieGroupingType.Rating;
	}

	public async CreateFolderVideoGroup() {
		let videoGroup = new VideoGroup();
		videoGroup.Name = "New Folder Group";
		videoGroup.MovieGroupingType = MovieGroupingType.Folder;
		videoGroup.Count = 10;
		this.RandomGroups!.splice(0, 0, videoGroup);

		this.ShowVideoGroupSetup(videoGroup);
	}

	public async CreateDateRangeVideoGroup() {
		let videoGroup = new VideoGroup();
		videoGroup.Name = "New Date Range Group";
		videoGroup.MovieGroupingType = MovieGroupingType.Range;
		videoGroup.Count = 10;
		this.RandomGroups!.splice(0, 0, videoGroup);

		this.ShowVideoGroupSetup(videoGroup);
	}

	public async CreateRatingVideoGroup() {
		let videoGroup = new VideoGroup();
		videoGroup.Name = "New Rating Group";
		videoGroup.MovieGroupingType = MovieGroupingType.Rating;
		videoGroup.Count = 10;
		this.RandomGroups!.splice(0, 0, videoGroup);

		this.ShowVideoGroupSetup(videoGroup);
	}

	public async CreateGenreVideoGroup() {
		let videoGroup = new VideoGroup();
		videoGroup.Name = "New Genre Group";
		videoGroup.MovieGroupingType = MovieGroupingType.Genres;
		videoGroup.Count = 10;
		this.RandomGroups!.splice(0, 0, videoGroup);

		this.ShowVideoGroupSetup(videoGroup);
	}

	public async CreateContinueWatchingVideoGroup() {
		let videoGroup = new VideoGroup();
		videoGroup.Name = "New Continue Watching Group";
		videoGroup.MovieGroupingType = MovieGroupingType.ContinueWatching;
		videoGroup.Count = 10;
		var savedGroup = await this.mediaService.AddVideoGroup(videoGroup);
		videoGroup.Id = savedGroup.Id;
		this.RandomGroups!.splice(0, 0, videoGroup);
	}

	public async CreateNewestVideoGroup() {
		let videoGroup = new VideoGroup();
		videoGroup.Name = "New Newest Group";
		videoGroup.MovieGroupingType = MovieGroupingType.Newest;
		videoGroup.Count = 10;
		var savedGroup = await this.mediaService.AddVideoGroup(videoGroup);
		videoGroup.Id = savedGroup.Id;
		this.RandomGroups!.splice(0, 0, videoGroup);
	}
}  