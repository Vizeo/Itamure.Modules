import { Component } from '@angular/core';
import { MediaItemType, MediaService, VideoFileMediaItem, UserMediaItemSearchResult, UserMediaItem } from './Services/mediaServer.service';
import { Router } from '@angular/router';

@Component({
	selector: 'search',
	templateUrl: './search.component.html',
	styleUrls: ['./search.component.less']
})
export class SearchComponent {
	constructor(private mediaService: MediaService,
		private router: Router) {
	}

	public Search: string = "";
	public VideoFileMediaItemSearchResults: (UserMediaItemSearchResult & IImage)[] | null = null;
	public MediaItemType = MediaItemType;

	public async DoSearch() {
		if (this.Search.length > 3) {
			this.VideoFileMediaItemSearchResults = await this.mediaService.Search(this.Search, 10);
			this.VideoFileMediaItemSearchResults.forEach(r => {
				r.Image = "/mediaServer/api/mediaServerService/GetUserMediaItemImage?uniqueKey=" + r.UniqueKey! + "&date=" + r.MetadataDate!.getTime();
			});
		}
	}

	public ImageError(img: HTMLImageElement) {
		img.src = "/MediaServer/assets/UnknownMedia.svg";
	}

	public ShowMovieDetail(movie: UserMediaItem) {
		this.router.navigate(['/', 'App', 'Movie', movie.UniqueKey]);
	}

	public ShowEpisodeDetail(movie: UserMediaItem) {
		this.router.navigate(['/', 'App', 'Movie', movie.UniqueKey]);
	}	
}

interface IImage {
	Image?: string;
}
