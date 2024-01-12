import { Component } from '@angular/core';
import { VideoGroupBaseComponent } from './videoGroupBase.component';
import { MediaService, FolderTree, Rating, MediaSubType } from '../../../Services/mediaServer.service';

@Component({
	selector: 'ratingVideoGroup',
	templateUrl: './ratingVideoGroup.component.html',
	styleUrls: ['./ratingVideoGroup.component.less']
})
export class RatingVideoGroupComponent extends VideoGroupBaseComponent {
	constructor(private mediaService: MediaService) {
		super();
	}

	public Ratings?: (Rating & ISelectedRating)[];

	public async ngAfterViewInit() {
		this.Ratings = await this.mediaService.GetRatings(MediaSubType.Movies);
		console.log(this.VideoGroup);

		if (this.VideoGroup != null &&
			this.VideoGroup.Options != null) {
			let options = <Options>JSON.parse(this.VideoGroup.Options);

			if (options.RatingIds != null) {
				for (let i = 0; i < options.RatingIds.length; i++) {
					var rating = this.Ratings.find(r => r.Id == options.RatingIds![i]);
					if (rating != null) {
						rating.Selected = true
					}
				}
			}
		}
	}

	public Update() {
		let options = new Options();
		options.RatingIds = this.Ratings!
			.filter(r => r.Selected)
			.map(r => r.Id!);

		this.VideoGroup!.Options = JSON.stringify(options);
	}
}

interface ISelectedRating {
	Selected?: boolean;
}

class Options {
	public RatingIds?: number[];
}
