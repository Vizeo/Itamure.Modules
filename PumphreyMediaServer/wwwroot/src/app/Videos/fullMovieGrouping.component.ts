import { Component } from '@angular/core';
import { MediaService, UserMediaItem } from '../Services/mediaServer.service';
import {  Router } from '@angular/router';
import { IMovieEx, ViewAllEvent } from './movieGrouping.component';
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

		this.ViewAll = mediaItemService.ViewAll;
	}
	
	public ViewAll?: ViewAllEvent | null;
	public Movies: (UserMediaItem & IMovieEx)[] | undefined;

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
		if (this.ViewAll != null) {

			var json = JSON.stringify(this.ViewAll.Options);
			this.Movies = await this.mediaService.GetMovieGrouping(this.ViewAll.MovieGroupingType!, 1000, json);

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