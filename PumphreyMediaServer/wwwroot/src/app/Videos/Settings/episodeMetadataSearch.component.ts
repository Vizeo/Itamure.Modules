import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VideoFileMediaItem, Series } from '../../Services/mediaServer.service';
import { EpisodeResult, MetadataService } from '../../Services/metadata.service';

@Component({
    selector: 'episodeMetadataSearch',
    templateUrl: './episodeMetadataSearch.component.html',
    styleUrls: ['./episodeMetadataSearch.component.less']
})
export class EpisodeMetadataSearchComponent {
    constructor(private metadataService: MetadataService) {
    }

    public Search: string = "";
    public EpisodeResult: EpisodeResult | null = null;

    private _videoFileMediaItem: VideoFileMediaItem | undefined;

    @Input("video")
    public set VideoFileMediaItem(val: VideoFileMediaItem | undefined) {
        this._videoFileMediaItem = val;
        if (val != null) {
            this.Search = val.Name!;
        }
        this.EpisodeResult = null;
    }
    public get VideoFileMediaItem(): VideoFileMediaItem | undefined {
        return this._videoFileMediaItem;
    }

    @Input("series")
    public Series: Series | null = null;

    public async SearchDatabase() {
        if (this.Series != null &&
            this.Series.Seasons != null &&
            this._videoFileMediaItem != null) {
            //Find the season index
            let seasonIndex = -1;
            for (let i = 0; i < this.Series.Seasons!.length; i++) {
                let season = this.Series.Seasons[i];
                if (season.Id == this._videoFileMediaItem.SeasonId) {
                    seasonIndex = i + 1;
                    break;
                }
            }

            this.EpisodeResult = await this.metadataService.EpisodeSearch(this.Series.Name!, seasonIndex, this._videoFileMediaItem.Order!);
        }
    }

    public SelectSearchItem(episodeResult: EpisodeResult) {
        this.Selected.emit(episodeResult);
    }

    @Output('selected')
    public Selected: EventEmitter<EpisodeResult> = new EventEmitter<EpisodeResult>();
}
