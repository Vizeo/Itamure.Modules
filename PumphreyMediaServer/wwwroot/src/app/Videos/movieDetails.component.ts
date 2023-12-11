import { Component, ElementRef, ViewChild } from '@angular/core';
import { MediaService, MediaSubType, MetadataTag, MetadataTagType, UserMediaItem } from '../Services/mediaServer.service';
import { VideoPlayerComponent } from './videoPlayer.component';
import { ActivatedRoute } from '@angular/router';
import { CastService, IReceiver } from '../Services/castService.service';
declare const cast: any;
declare const chrome: any;

@Component({
    selector: 'movieDetails',
    templateUrl: './movieDetails.component.html',
    styleUrls: ['./movieDetails.component.less']
})
export class MovieDetailsComponent {
    constructor(private mediaService: MediaService,
        private route: ActivatedRoute,
        private castService: CastService) {
    }

    public Rating: string = "";
    public Image: string = "";
    public Movie: UserMediaItem | null = null;
    public Genres: string = "";
    public Actors: string = "";
    public Writers: string = "";
    public Directors: string = "";
    public Duration: string = "";
    public MovieVisible: boolean = false;
    public UserActive: boolean = false;
    public Receivers: IReceiver[] | null = null;
    
    private _timout: number = 0;

    ngAfterViewInit() {
        this.route.params.subscribe(async params => {
            let movieId = params['id'];

            this.Movie = await this.mediaService.GetVideoMediaItem(movieId);
            this.Image = "/mediaServer/api/mediaServerService/GetUserMediaItemImage?uniqueKey=" + movieId + "&date=" + this.Movie.MetadataDate!.getTime();
            let ratings = await this.mediaService.GetRatings(MediaSubType.Movies);
            let rating = ratings.find(r => r.Id == this.Movie!.RatingId!);
            if (rating != null) {
                this.Rating = rating.Name!;
            }
            this.Genres = this.CreateList(this.Movie.MetadataTags!, MetadataTagType.Genre);
            this.Actors = this.CreateList(this.Movie.MetadataTags!, MetadataTagType.Actor);
            this.Writers = this.CreateList(this.Movie.MetadataTags!, MetadataTagType.Writer);
            this.Directors = this.CreateList(this.Movie.MetadataTags!, MetadataTagType.Director);

            this.CalcDuration();
        });        
    }

    public get CanCast(): boolean {
        return this.castService.IsConnected;
    }

    private CreateList(metadataTags: MetadataTag[], metadataType: MetadataTagType) {
        let tags = metadataTags.filter(t => t.MetadataTagType == metadataType)
            .map(a => a.Value);
        return tags.join(", ");
    }

    private CalcDuration() {
        if (this.Movie!.Duration != null) {
            let minutes = this.Movie!.Duration / 60;
            let hours = Math.round(minutes / 60);

            minutes = Math.round(minutes % 60);

            if (minutes > 9) {
                this.Duration = hours + "h " + minutes + "m"
            }
            else {
                this.Duration = hours + "h 0" + minutes + "m"
            }
            return;
        }
        this.Duration = "";
    }

    public MovieImageError() {
        this.Image = "/MediaServer/assets/UnknownMedia.svg";
    }

    public PlayMovie() {
        this.MovieVisible = true;
        setTimeout(() => this._videoPlayer!.VideoFileMediaItem = this.Movie!);        
    }

    public CloseMovie() {
        this._videoPlayer!.Stop();
        this.MovieVisible = false;
    }

    private CountDown() {
        this._timout--;
        if (this._timout > 0) {
            setTimeout(() => this.CountDown(), 1000);
        }
        else {
            this.UserActive = false;
        }
    }

    public MouseMove() {
        if (this._timout == 0) {
            this.UserActive = true;
            setTimeout(() => this.CountDown(), 1000);
        }
        this._timout = 5;
    }

    public async ShowCastDevices() {
        this.Receivers = await this.castService.GetReceivers();
        this._castDevicesDialog.nativeElement.showModal();
    }

    public CloseCastDevices() {
        this._castDevicesDialog.nativeElement.close();
    }

    public PlayVideoOnDevice(receiver: IReceiver) {
        this.castService.PlayOnReceiver(receiver, this.Movie!);
    }

    @ViewChild(VideoPlayerComponent)
    private _videoPlayer: VideoPlayerComponent | undefined;

    @ViewChild("castDevicesDialog")
    private _castDevicesDialog!: ElementRef<HTMLDialogElement>;
}