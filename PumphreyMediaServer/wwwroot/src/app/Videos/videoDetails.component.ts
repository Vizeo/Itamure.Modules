import { Component, ElementRef, ViewChild } from '@angular/core';
import { MediaService, MediaSubType, MetadataTag, MetadataTagType, UserMediaItem } from '../Services/mediaServer.service';
import { VideoPlayerComponent } from './videoPlayer.component';
import { ActivatedRoute } from '@angular/router';
import { CastService, Receiver } from '../Services/castService.service';

@Component({
    selector: 'videoDetails',
    templateUrl: './videoDetails.component.html',
    styleUrls: ['./videoDetails.component.less']
})
export class videoDetailsComponent {
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
    public Receivers: Receiver[] | null = null;
    public PositionPercent: number = 0;
    
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
            this.PositionPercent = (this.Movie!.Position! / this.Movie!.Duration!) * 100;
            this.CalcDuration();
        });        
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

    public get ShowRestart(): boolean {
        return this.Movie!.Position! > 0 &&
            Math.floor(this.Movie!.Position!) != Math.floor(this.Movie!.Duration!);
    }

    public PlayMovie() {
        this.MovieVisible = true;
        setTimeout(() => {
            if (Math.floor(this.Movie!.Position!) != Math.floor(this.Movie!.Duration!)) {
                this._videoPlayer!.Position = this.Movie!.Position!;
            }
            this._videoPlayer!.VideoFileMediaItem = this.Movie!;
        });
    }

    public RestartMovie() {
        this.MovieVisible = true;
        setTimeout(() => {
            this._videoPlayer!.Position = 0;
            this._videoPlayer!.VideoFileMediaItem = this.Movie!;
        });
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
        this.Receivers = this.castService.Receivers;
        this._castDevicesDialog.nativeElement.showModal();
    }

    public CloseCastDevices() {
        this._castDevicesDialog.nativeElement.close();
    }

    public async PlayVideoOnDevice(receiver: Receiver) {
        await this.castService.PlayOnReceiver(receiver, this.Movie!, this.Movie!.Position!);
        this.CloseCastDevices();
        this.CloseMovie();
    }

    Recast() {
        this.ShowCastDevices();
    }

    @ViewChild(VideoPlayerComponent)
    private _videoPlayer: VideoPlayerComponent | undefined;

    @ViewChild("castDevicesDialog")
    private _castDevicesDialog!: ElementRef<HTMLDialogElement>;
}