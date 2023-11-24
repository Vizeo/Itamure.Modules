import { Component, Input } from '@angular/core';
import { MediaService, MediaSubType, Rating } from './Services/mediaServer.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'ratingSetting',
    templateUrl: './ratingSetting.component.html',
    styleUrls: ['./ratingSetting.component.less']
})
export class RatingSettingComponent {
    constructor(private route: ActivatedRoute,
        private mediaService: MediaService) {
    }

    public Ratings: Rating[] | undefined;

    ngOnInit() {
        // First get the product id from the current route.
        const routeParams = this.route.snapshot.paramMap;
        const mediaType = MediaSubType[Number(routeParams.get('mediaSubType'))];

        // Find the product that correspond with the id provided in route.
        this.GetRatings(<MediaSubType><any>mediaType);
    }

    private async GetRatings(mediaSubType: MediaSubType) {
        this.Ratings = await this.mediaService.GetRatings(mediaSubType);
    }
}
