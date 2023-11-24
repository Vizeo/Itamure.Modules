import { Component } from '@angular/core';
import { MovieGroupingType, VideoFileMediaItem } from '../Services/mediaServer.service';
import { Router } from '@angular/router';

@Component({
    selector: 'moviesView',
    templateUrl: './moviesView.component.html',
    styleUrls: ['./moviesView.component.less']
})
export class MoviesViewComponent {
    constructor(private router: Router) {
    }

    public MovieGroupingType = MovieGroupingType;

    public ShowDetail(movie: VideoFileMediaItem) {
        this.router.navigate(['/', 'App', 'Movie', movie.Id]);
    }  
}
