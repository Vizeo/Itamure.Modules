import { Component, ElementRef, ViewChild } from '@angular/core';
import { MediaService, MediaSubType, Season, Series, VideoFileMediaItem } from '../Services/mediaServer.service';
import { ActivatedRoute } from '@angular/router';
import { VideoPlayerComponent } from './videoPlayer.component';

@Component({
    selector: 'seriesDetails',
    templateUrl: './seriesDetails.component.html',
    styleUrls: ['./seriesDetails.component.less']
})
export class SeriesDetailsComponent {
    constructor(private mediaService: MediaService,
        private route: ActivatedRoute) {
    }

    public Series: Series | null = null;
    public Rating: string = "";
    public Image: string = "";
    public SelectedSeason: Season | null = null;
    public HasImageError: boolean = false;
    public Episodes: (VideoFileMediaItem & IEpisodeEx)[] | null = null;

    ngOnInit() {
        this.route.params.subscribe(async params => {
            let seriesId = +params['id'];

            this.Series = await this.mediaService.GetSeries(seriesId);
            this.Image = "/mediaServer/api/mediaServerService/GetSeriesImage?seriesId=" + this.Series!.Id! + "&date=" + (new Date().getTime());
            let ratings = await this.mediaService.GetRatings(MediaSubType.Series);
            let rating = ratings.find(r => r.Id == this.Series!.RatingId!);
            if (rating != null) {
                this.Rating = rating.Name!;
            }

            if (this.Series != null &&
                this.Series.Seasons != null &&
                this.Series.Seasons.length > 0) {
                this.SelectedSeason = this.Series.Seasons[0];
                await this.GetEpisodes();
            }
        });
    }

    @ViewChild("videoPlayerDialog")
    private _videoPlayerDialog: ElementRef<HTMLDialogElement> | undefined; 

    @ViewChild(VideoPlayerComponent)
    private _videoPlayer: VideoPlayerComponent | undefined;


    public ImageError() {
        this.Image = "/MediaServer/assets/UnknownMedia.svg";
        this.HasImageError = true;
    }

    public EpisodeImageError(episode: IEpisodeEx) {
        episode.Image = "/MediaServer/assets/UnknownMedia.svg";
    }

    public async SetSeason(season: Season) {
        this.SelectedSeason = season;
        await this.GetEpisodes();
    }

    private async GetEpisodes() {
        if (this.Series != null &&
            this.SelectedSeason != null) {
            this.Episodes = await this.mediaService.GetSeasonMediaItems(this.Series.Id!, this.SelectedSeason.Id!);

            for (let i = 0; i < this.Episodes.length; i++) {
                this.Episodes[i].Image = "/mediaServer/api/mediaServerService/GetVideoFileMediaItemImage?mediaItemId=" + this.Episodes[i].Id! + "&date=" + (new Date().getTime());
            }
        }
    }

    public PlayEpisode(episode: VideoFileMediaItem) {
        this._videoPlayerDialog!.nativeElement.showModal();
        this._videoPlayer!.VideoFileMediaItem = episode;
    }

    public ClosePlayer() {
        this._videoPlayer!.Stop();
        this._videoPlayerDialog!.nativeElement.close();
    }
}

interface IEpisodeEx {
    Image?: string;
}
