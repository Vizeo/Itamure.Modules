import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VideoFileMediaItem } from '../../Services/mediaServer.service';
import { MetadataService, SearchItem, SearchResult } from '../../Services/metadata.service';

@Component({
    selector: 'movieMetadataSearch',
    templateUrl: './movieMetadataSearch.component.html',
    styleUrls: ['./movieMetadataSearch.component.less']
})
export class MovieMetadataSearchComponent {
    constructor(private metadataService: MetadataService) {
    }

    public Search: string = "";
    public SearchResult: SearchResult | null = null;
    public SelectedSearchItem: SearchItem | null = null;

    private _videoFileMediaItem: VideoFileMediaItem | undefined;

    @Input("video")
    public set VideoFileMediaItem(val: VideoFileMediaItem | undefined) {
        this._videoFileMediaItem = val;
        if (val != null) {
            this.Search = val.Name!;
        }
        this.SearchResult = null;
        this.SelectedSearchItem = null;
    }
    public get VideoFileMediaItem(): VideoFileMediaItem | undefined {
        return this._videoFileMediaItem;
    }

    public async SearchDatabase() {
        this.SearchResult = await this.metadataService.MovieSearch(this.Search);
    }

    public SelectSearchItem(searchItem: SearchItem) {
        this.SelectedSearchItem = searchItem;
        this.Selected.emit(searchItem);
    }

    @Output('selected')
    public Selected: EventEmitter<SearchItem> = new EventEmitter<SearchItem>();
}
