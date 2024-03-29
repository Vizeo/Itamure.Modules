import { Component, ElementRef, ViewChild } from '@angular/core';
import { MediaService, MediaSubType, Season, Series, UserMediaItem } from '../Services/mediaServer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoPlayerComponent } from './videoPlayer.component';

@Component({
    selector: 'seriesDetails',
    templateUrl: './seriesDetails.component.html',
    styleUrls: ['./seriesDetails.component.less']
})
export class SeriesDetailsComponent {
    constructor(private mediaService: MediaService,
        private route: ActivatedRoute,
        private router: Router) {
    }

    public Series: Series | null = null;
    public Rating: string = "";
    public Image: string = "";
    public SelectedSeason: Season | null = null;
    public HasImageError: boolean = false;
    public Episodes: (UserMediaItem & IEpisodeEx)[] | null = null;
    public UserActive: boolean = false;
    public MovieVisible: boolean = false;
    public MostRecent: UserMediaItem | null = null;

    private _timout: number = 0;

    async ngOnInit() {
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

                this.MostRecent = await this.mediaService.GetSeriesMostRecent(seriesId);

                console.log("Yeah", this.MostRecent);

                if (this.MostRecent == null ||
                    this.MostRecent.SeriesId == null) {
                    this.SelectedSeason = this.Series.Seasons[0];
                    this.MostRecent = null;
                }
                else {
                    var seasonIndex = this.Series.Seasons.findIndex(s => s.Id == this.MostRecent!.SeasonId);
                    this.SelectedSeason = this.Series.Seasons[seasonIndex];
                }
                await this.GetEpisodes();
            }
        });
    }

    @ViewChild("videoPlayerDialog")
    private _videoPlayerDialog: ElementRef<HTMLDialogElement> | undefined; 

    @ViewChild(VideoPlayerComponent)
    private _videoPlayer: VideoPlayerComponent | undefined;

    public Continue() {
        this.router.navigate(['/', 'App', 'Movie', this.MostRecent!.UniqueKey]);
    }

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
            this.Episodes = await this.mediaService.GetSeasonUserMediaItems(this.Series.Id!, this.SelectedSeason.Id!);

            for (let i = 0; i < this.Episodes.length; i++) {
                let episode = this.Episodes[i];
                episode.PositionPercent = (episode.Position! / episode.Duration!) * 100;
                this.Episodes[i].Image = "/mediaServer/api/mediaServerService/GetUserMediaItemImage?uniqueKey=" + this.Episodes[i].UniqueKey! + "&date=" + this.Episodes[i].MetadataDate!.getTime();
            }
        }
    }

    public PlayEpisode(episode: UserMediaItem) {
        this.router.navigate(['/', 'App', 'Movie', episode.UniqueKey]);
    }

    public ClosePlayer() {
        this._videoPlayer!.Stop();
        this._videoPlayerDialog!.nativeElement.close();
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
}

interface IEpisodeEx {
    Image?: string;
    PositionPercent?: number;
}
