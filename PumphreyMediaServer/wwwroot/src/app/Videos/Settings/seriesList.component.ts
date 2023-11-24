import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MediaService, Season, Series, VideoFileMediaItem } from '../../Services/mediaServer.service';
import { IVideoManager } from './videoSettings.component';
import { GlobalService } from 'interLink';
import { SeriesEditorComponent } from './seriesEditor.component';

@Component({
    selector: 'seriesList',
    templateUrl: './seriesList.component.html',
    styleUrls: ['./seriesList.component.less']
})
export class SeriesListComponent implements IVideoManager {
    constructor(private mediaService: MediaService,
        private globalService: GlobalService) {
    }

    @ViewChild("seriesEditor")
    private _seriesEditor!: SeriesEditorComponent;

    public MoviesVideoMediaItems: VideoFileMediaItem[] | undefined;
    public FilteredMovieVideoMediaItems: VideoFileMediaItem[] | null = null;
    public Selected: VideoFileMediaItem[] | null = null;
    public Filter: string = "";
    public NewSeries: Series | null = null;
    
    @Output("seriesAdded")
    public SeriesAdded = new EventEmitter<Series>();  
    
    public get CanAdd(): boolean {
        return true;
    }

    public get CanEdit(): boolean {
        return false;
    }

    public get CanDelete(): boolean {
        return false;
    }

    public Add(): void {
        this.NewSeries = new Series();
        this.NewSeries.Seasons = new Array<Season>();
        this._seriesEditor.DownloadFile = null;
        this._seriesEditor.Show();
    }

    public Edit(): void {
    }

    public Delete(): void {
    }

    public SaveSeries() {
        this.SeriesAdded.emit(this.NewSeries!);
        this.NewSeries = null;
    }

    public CancelSaveSeries() {
        this.NewSeries = null;
    }
}
