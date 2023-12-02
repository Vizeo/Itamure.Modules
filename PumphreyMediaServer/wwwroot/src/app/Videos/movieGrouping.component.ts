import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MediaService, MovieGroupingType, VideoFileMediaItem } from '../Services/mediaServer.service';
import { VideoPlayerComponent } from './videoPlayer.component';

@Component({
    selector: 'movieGrouping',
    templateUrl: './movieGrouping.component.html',
    styleUrls: ['./movieGrouping.component.less']
})
export class MovieGroupingComponent {
    constructor(private mediaService: MediaService) {
    }

    @Input("title")
    public Title: string = "Unset";

    @Input("grouping")
    public Grouping: MovieGroupingType | undefined;

    @Input("count")
    public Count: number | undefined;

    @Input("options")
    public Options: any = new Object();

    @ViewChild("moviesList")
    public MoviesList: ElementRef<HTMLDivElement> | undefined;
    
    public Movies: (VideoFileMediaItem & IMovieEx)[] | undefined;
    public AllTheWayRight: boolean = false;
    public AllTheWayLeft: boolean = true;

    public get Overflowing(): boolean {
        return this.MoviesList != null &&
            this.MoviesList.nativeElement.scrollWidth > this.MoviesList.nativeElement.clientWidth;
    }

    public ScrollLeft() {
        if (this.MoviesList != null) {
            const moveAmount = this.MoviesList.nativeElement.clientWidth / 2;

            this.MoviesList.nativeElement.scroll({
                top: 0,
                left: this.MoviesList.nativeElement.scrollLeft - moveAmount,
                behavior: 'smooth'
            });
        }
    }

    public UpdatePaddles() {
        this.AllTheWayLeft = this.MoviesList != null &&
            this.MoviesList.nativeElement.scrollLeft == 0;

        this.AllTheWayRight = this.MoviesList != null &&
            Math.ceil(this.MoviesList.nativeElement.scrollLeft + this.MoviesList.nativeElement.offsetWidth) >= this.MoviesList.nativeElement.scrollWidth;
    }

    public ScrollRight() {
        if (this.MoviesList != null) {
            const moveAmount = this.MoviesList.nativeElement.clientWidth / 2;

            this.MoviesList.nativeElement.scroll({
                top: 0,
                left: this.MoviesList.nativeElement.scrollLeft + moveAmount,
                behavior: 'smooth'
            });
        }
    }

    @Output("selected")
    public Selected = new EventEmitter<VideoFileMediaItem>();

    public MovieImageError(movie: IMovieEx) {
        movie.Image = "/MediaServer/assets/UnknownMedia.svg";
    }

    public SelectMovie(movie: VideoFileMediaItem & IMovieEx) {
        this.Selected.emit(movie);
    }

    ngAfterViewInit() {
        this.GetMovies();

        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                this.UpdatePaddles();
            });
        });

        observer.observe(this.MoviesList!.nativeElement!, {
            characterDataOldValue: true,
            subtree: true,
            childList: true,
            characterData: true
        });
   }

    private async GetMovies() {
        if (this.Count != null &&
            this.Grouping != null) {

            var json = JSON.stringify(this.Options);
            this.Movies = await this.mediaService.GetMovieGrouping(this.Grouping, this.Count, json);

            for (let i = 0; i < this.Movies.length; i++) {
                this.Movies[i].Image = "/mediaServer/api/mediaServerService/GetVideoFileMediaItemImage?mediaItemId=" + this.Movies[i].Id! + "&date=" + (new Date().getTime());
            }

            this.UpdatePaddles();
        }
    }
}

export interface IMovieEx {
    Image?: string;
}
