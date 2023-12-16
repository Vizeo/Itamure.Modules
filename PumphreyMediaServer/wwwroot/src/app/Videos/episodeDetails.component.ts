import { Component, ElementRef, ViewChild } from '@angular/core';
import { MediaService, MediaSubType, MetadataTag, MetadataTagType, UserMediaItem } from '../Services/mediaServer.service';
import { VideoPlayerComponent } from './videoPlayer.component';
import { ActivatedRoute } from '@angular/router';
import { CastService, Receiver } from '../Services/castService.service';

@Component({
    selector: 'episodeDetails',
    templateUrl: './episodeDetails.component.html',
    styleUrls: ['./episodeDetails.component.less']
})
export class EpisodeDetailsComponent {
    constructor(private mediaService: MediaService,
        private route: ActivatedRoute,
        private castService: CastService) {
    }

    public Rating: string = "";
    public Image: string = "";
    public Episode: UserMediaItem | null = null;
    public Genres: string = "";
    public Actors: string = "";
    public Writers: string = "";
    public Directors: string = "";
    public Duration: string = "";
    public EpisodeVisible: boolean = false;
    public UserActive: boolean = false;
    public Receivers: Receiver[] | null = null;
   
    private _timout: number = 0;

    ngAfterViewInit() {
        this.route.params.subscribe(async params => {
            let EpisodeId = <string>params['id'];

            this.Episode = await this.mediaService.GetVideoMediaItem(EpisodeId);
            this.Image = "/mediaServer/api/mediaServerService/GetUserMediaItemImage?uniqueKey=" + EpisodeId + "&date=" + this.Episode.MetadataDate!.getTime();
            let ratings = await this.mediaService.GetRatings(MediaSubType.Series);
            let rating = ratings.find(r => r.Id == this.Episode!.RatingId!);
            if (rating != null) {
                this.Rating = rating.Name!;
            }
            this.Genres = this.CreateList(this.Episode.MetadataTags!, MetadataTagType.Genre);
            this.Actors = this.CreateList(this.Episode.MetadataTags!, MetadataTagType.Actor);
            this.Writers = this.CreateList(this.Episode.MetadataTags!, MetadataTagType.Writer);
            this.Directors = this.CreateList(this.Episode.MetadataTags!, MetadataTagType.Director);

            this.CalcDuration();
        });        
    }

    private CreateList(metadataTags: MetadataTag[], metadataType: MetadataTagType) {
        let tags = metadataTags.filter(t => t.MetadataTagType == metadataType)
            .map(a => a.Value);
        return tags.join(", ");
    }

    private CalcDuration() {
        if (this.Episode!.Duration != null) {
            let minutes = this.Episode!.Duration / 60;
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

    public EpisodeImageError() {
        this.Image = "/MediaServer/assets/UnknownMedia.svg";
    }

    public PlayEpisode() {
        this.EpisodeVisible = true;
        setTimeout(() => this._videoPlayer!.VideoFileMediaItem = this.Episode!);        
    }

    public CloseEpisode() {
        this._videoPlayer!.Stop();
        this.EpisodeVisible = false;
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

    public CloseCastDevices() {
        this._castDevicesDialog.nativeElement.close();
    }

    public async ShowCastDevices() {
        this.Receivers = this.castService.Receivers;
        this._castDevicesDialog.nativeElement.showModal();
    }

    public PlayVideoOnDevice(receiver: Receiver) {
        this.castService.PlayOnReceiver(receiver, this.Episode!);
        this.CloseCastDevices();
    }

    @ViewChild(VideoPlayerComponent)
    private _videoPlayer: VideoPlayerComponent | undefined;

    @ViewChild("castDevicesDialog")
    private _castDevicesDialog!: ElementRef<HTMLDialogElement>;
}