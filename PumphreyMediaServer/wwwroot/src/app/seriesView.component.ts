import { Component } from '@angular/core';
import { MediaService, MediaSubType, Rating, Series } from './Services/mediaServer.service';
import { Router } from '@angular/router';

@Component({
    selector: 'seriesView',
    templateUrl: './seriesView.component.html',
    styleUrls: ['./seriesView.component.less']
})
export class SeriesViewComponent {
    constructor(private mediaService: MediaService,
        private router: Router) {
        this.GetSeries();
        if (SeriesViewComponent._ratings == null) {
            this.GetRatings();
        }
    }

    private static _ratings: Rating[] | null;

    public SeriesList: Series[] | null = null;

    public get Ratings(): Rating[] | null {
        return SeriesViewComponent._ratings;
    }

    private async GetSeries() {
        this.SeriesList = await this.mediaService.GetSeriesList();
        this.SeriesList.sort((a, b) => {
            if (a.Name! < b.Name!) return -1;
            if (a.Name! < b.Name!) return 1;
            return 0;
        });
    }

    private async GetRatings() {
        SeriesViewComponent._ratings = await this.mediaService.GetRatings(MediaSubType.Series);
    }

    public ShowDetails(series: Series) {
        this.router.navigate(['/', 'App', 'Series', series.Id]);
    }
}
