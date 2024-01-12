import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MediaService, MovieGroupingType, UserMediaItem, VideoGroup } from '../Services/mediaServer.service';
import { Router } from '@angular/router';
import { MediaItemService } from '../Services/mediaItem.service';

@Component({
    selector: 'movieGrouping',
    templateUrl: './movieGrouping.component.html',
    styleUrls: ['./movieGrouping.component.less']
})
export class MovieGroupingComponent {
    constructor(private mediaService: MediaService,
        private mediaItemService: MediaItemService,
        private router: Router) {
    }

    private _loaded: boolean = false;;

    @Input("videoGroup")
    public VideoGroup?: VideoGroup;

    @ViewChild("moviesList")
    public MoviesList: ElementRef<HTMLDivElement> | undefined;

    @Output("selected")
    public Selected = new EventEmitter<UserMediaItem>();
    
    public Movies: (UserMediaItem & IMovieEx)[] | undefined;
    public AllTheWayRight: boolean = false;
    public AllTheWayLeft: boolean = true;
    public NoItems: boolean = false;

    public OnShowAll() {
        this.mediaItemService.ViewAllVideoGroup = this.VideoGroup!;
        this.router.navigate(['/', 'App', 'FullGroupView']);
    }

    public Load() {
        if (!this._loaded) {
            this.GetMovies();
            this._loaded = true;
        }
    }

    public CanShowAll(): boolean {
        return this.VideoGroup?.MovieGroupingType == MovieGroupingType.Folder ||
            this.VideoGroup?.MovieGroupingType == MovieGroupingType.Genres ||
            this.VideoGroup?.MovieGroupingType == MovieGroupingType.Range ||
            this.VideoGroup?.MovieGroupingType == MovieGroupingType.Rating;
    }

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

    public MovieImageError(movie: IMovieEx) {
        movie.Image = "/MediaServer/assets/UnknownMedia.svg";
    }

    public SelectMovie(movie: UserMediaItem & IMovieEx) {
        this.Selected.emit(movie);
    }

    ngAfterViewInit() {
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
        if (this.VideoGroup != null) {
            this.Movies = await this.mediaService.GetVideoGroupMedia(this.VideoGroup.Id!, false);

            if (this.Movies.length > 0) {
                for (let i = 0; i < this.Movies.length; i++) {
                    this.Movies[i].Image = "/mediaServer/api/mediaServerService/GetUserMediaItemImage?uniqueKey=" + this.Movies[i].UniqueKey + "&date=" + this.Movies[i].MetadataDate!.getTime();
                }

                this.UpdatePaddles();
            }
            else {
                this.NoItems = true;
            }
        }
    }

    private _xStart: number = 0;
    private _oldXScrollPos: number = 0;

    public Touchstart(event: TouchEvent) {
        this._xStart = event.touches[0].clientX;
        this._oldXScrollPos = this.MoviesList?.nativeElement.scrollLeft!;
    }

    public Touchmove(event: TouchEvent) {
        let x = event.touches[0].clientX;            
        let xDiff = this._xStart - x;
        this.MoviesList!.nativeElement.scrollLeft = this._oldXScrollPos + xDiff;
    }
}

export interface IMovieEx {
    Image?: string;
}