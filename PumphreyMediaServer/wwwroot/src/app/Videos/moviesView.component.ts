import { Component } from '@angular/core';
import { MediaService, MovieGroupingType, UserMediaItem, VideoGroup } from '../Services/mediaServer.service';
import { Router } from '@angular/router';

@Component({
    selector: 'moviesView',
    templateUrl: './moviesView.component.html',
    styleUrls: ['./moviesView.component.less']
})
export class MoviesViewComponent {
    constructor(private router: Router,
        private mediaService: MediaService) {
        this.GetVideoGroups();
    }

    public VideoGroups: VideoGroup[] | null = null;
    public MovieGroupingType = MovieGroupingType;

    public async GetVideoGroups() {
        this.VideoGroups = await this.mediaService.GetVideoGroups();        
    }

    public ShowDetail(movie: UserMediaItem) {
        this.router.navigate(['/', 'App', 'Movie', movie.UniqueKey]);
    }  
}
