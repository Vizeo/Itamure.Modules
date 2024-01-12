import { Component } from '@angular/core';
import { MediaService, UserMediaItem, VideoGroup } from '../Services/mediaServer.service';
import { Router } from '@angular/router';
import { IMovieEx } from './movieGrouping.component';
import { MediaItemService } from '../Services/mediaItem.service';

@Component({
	selector: 'fullMovieGrouping',
	templateUrl: './fullMovieGrouping.component.html',
	styleUrls: ['./fullMovieGrouping.component.less']
})
export class FullMovieGroupingComponent {
	constructor(private mediaService: MediaService,
		mediaItemService: MediaItemService,
		private router: Router) {
		this.ViewAllVideoGroup = mediaItemService.ViewAllVideoGroup!;
	}
	
	public Movies: (UserMediaItem & IMovieEx)[] | undefined;
	public ViewAllVideoGroup: VideoGroup;

	public ShowDetail(movie: UserMediaItem) {
		this.router.navigate(['/', 'App', 'Movie', movie.UniqueKey]);
	}  

	public MovieImageError(movie: IMovieEx) {
		movie.Image = "/MediaServer/assets/UnknownMedia.svg";
	}

	ngAfterViewInit() {
		this.GetMovies();
	}

	private async GetMovies() {
		if (this.ViewAllVideoGroup != null) {
			this.Movies = await this.mediaService.GetVideoGroupMedia(this.ViewAllVideoGroup!.Id!, true);

			for (let i = 0; i < this.Movies.length; i++) {
				this.Movies[i].Image = "/mediaServer/api/mediaServerService/GetUserMediaItemImage?uniqueKey=" + this.Movies[i].UniqueKey! + "&date=" + this.Movies[i].MetadataDate!.getTime();
			}

			this.Movies.sort((a, b) => {
				if (a.Name! < b.Name!) return -1;
				if (a.Name! > b.Name!) return 1;
				return 0;
			})
		}
	}
}