import { Component, ViewChild } from '@angular/core';
import { MediaService, MediaSubType, MetadataTag, MetadataTagType, VideoFileMediaItem } from '../Services/mediaServer.service';
import { VideoPlayerComponent } from './videoPlayer.component';
import { ActivatedRoute } from '@angular/router';
declare const cast: any;
declare const chrome: any;

@Component({
    selector: 'movieDetails',
    templateUrl: './movieDetails.component.html',
    styleUrls: ['./movieDetails.component.less']
})
export class MovieDetailsComponent {
    constructor(private mediaService: MediaService,
        private route: ActivatedRoute) {
    }

    public Rating: string = "";
    public Image: string = "";
    public Movie: VideoFileMediaItem | null = null;
    public Genres: string = "";
    public Actors: string = "";
    public Writers: string = "";
    public Directors: string = "";
    public Duration: string = "";
    public MovieVisible: boolean = false;
    public UserActive: boolean = false;
    

    private _timout: number = 0;

    private async SetupCast(movieId: number) {
        //These are loaded by an api
        var castSession = cast.framework.CastContext.getInstance().getCurrentSession();
        var url = "http://itamure.vizeotech.com/mediaServer/streamingService?mediaItemId=" + movieId;
        //var url = "https://www.w3schools.com/html/mov_bbb.mp4";
        console.log(url);
        var mediaInfo = new chrome.cast.media.MediaInfo(url, "video/mp4");
        var request = new chrome.cast.media.LoadRequest(mediaInfo);

        try {
            await castSession.loadMedia(request);
        } catch (e) {
            console.error(e);
        }
    }

    ngAfterViewInit() {
        this.route.params.subscribe(async params => {
            let movieId = +params['id'];

            this.Image = "/mediaServer/api/mediaServerService/GetVideoFileMediaItemImage?mediaItemId=" + movieId + "&date=" + (new Date().getTime());
            this.Movie = await this.mediaService.GetVideoMediaItem(movieId);
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
            this.SetupCast(movieId);
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

    @ViewChild(VideoPlayerComponent)
    private _videoPlayer: VideoPlayerComponent | undefined;
}