import { Component } from '@angular/core';
import { VideoGroupBaseComponent } from './videoGroupBase.component';
import { MediaService, FolderTree, Rating, MediaSubType, StringValue } from '../../../Services/mediaServer.service';

@Component({
	selector: 'genreVideoGroup',
	templateUrl: './genreVideoGroup.component.html',
	styleUrls: ['./genreVideoGroup.component.less']
})
export class GenreVideoGroupComponent extends VideoGroupBaseComponent {
	constructor(private mediaService: MediaService) {
		super();
	}

	public Genres?: (StringValue & ISelectedGenre)[];

	public async ngAfterViewInit() {
		this.Genres = await this.mediaService.GetGenres();

		console.log(this.VideoGroup);

		if (this.VideoGroup != null &&
			this.VideoGroup.Options != null) {
			let options = <Options>JSON.parse(this.VideoGroup.Options);

			if (options.Genres != null) {
				for (let i = 0; i < options.Genres.length; i++) {
					var genre = this.Genres.find(r => r.Value == options.Genres![i]);
					if (genre != null) {
						genre.Selected = true
					}
				}
			}
		}
	}

	public Update() {
		let options = new Options();
		options.Genres = this.Genres!
			.filter(r => r.Selected)
			.map(r => r.Value!);

		this.VideoGroup!.Options = JSON.stringify(options);
	}
}

interface ISelectedGenre {
	Selected?: boolean;
}

class Options {
	public Genres?: string[];
}
