import { Component } from '@angular/core';
import { MovieGroupingType, UserMediaItem } from '../Services/mediaServer.service';
import { Router } from '@angular/router';
import { MediaItemService } from '../Services/mediaItem.service';

@Component({
    selector: 'moviesView',
    templateUrl: './moviesView.component.html',
    styleUrls: ['./moviesView.component.less']
})
export class MoviesViewComponent {
    constructor(private router: Router,
        private mediaItemService: MediaItemService) {
    }

    public MovieGroupingType = MovieGroupingType;

    public ShowDetail(movie: UserMediaItem) {
        this.router.navigate(['/', 'App', 'Movie', movie.UniqueKey]);
    }  
}
