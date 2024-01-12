import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MediaService, Season, Series } from '../../Services/mediaServer.service';
import { IVideoManager } from './videoSettings.component';
import { GlobalService, IEditableObject, SortChangeEvent } from 'interLink';
import { SeriesEditorComponent } from './seriesEditor.component';
import { SeasonEditorComponent } from './seasonEditor.component';

@Component({
    selector: 'seasonList',
    templateUrl: './seasonList.component.html',
    styleUrls: ['./seasonList.component.less']
})
export class SeasonListComponent implements IVideoManager {
    constructor(private mediaService: MediaService,
        private globalService: GlobalService) {
    }

    @ViewChild("seriesEditor")
    private _seriesEditor: SeriesEditorComponent | null = null;
    @ViewChild("seasonEditor")
    private _seasonEditor: SeasonEditorComponent | null = null;

    public EditingSeries: Series | null = null;
    public EditingSeason: (Season & IEditableObject) | null = null;
    
    @Input("series")
    public Series: Series | null = null;

    @Output("seriesDeleted")
    public SeriesDeleted = new EventEmitter<Series>();  

    @Output("seasonAdded")
    public SeasonAdded = new EventEmitter<Season>();  

    @Output("seriesUpdated")
    public SeriesUpdated = new EventEmitter<Season>();  

    public get CanAdd(): boolean {
        return true;
    }

    public get CanEdit(): boolean {
        return this.Series != null;
    }

    public get CanDelete(): boolean {
        return this.Series != null;
    }

    public Add(): void {        
        let season = new Season();
        this.EditingSeason = this.globalService.CreateProxy(season);
        this._seasonEditor!.Show();
    }

    public Edit(): void {
        this.EditingSeries = this.Series;
        this._seriesEditor!.Show();
    }

    public Delete(): void {
        if (this.Series != null &&
            confirm("Delete series " + this.Series.Name + "?\nAll videos will be moved the unassigned folder.")) {
            this.mediaService.DeleteSeries(this.Series.Id!);
            this.SeriesDeleted.emit(this.Series);
        }
    }

    public async SeasonSortChange(event: SortChangeEvent) {
        if (this.Series != null &&
            this.Series.Seasons != null) {
            this.Series.Seasons.splice(event.OldIndex, 1);
            this.Series.Seasons.splice(event.NewIndex, 0, event.Item);

            for (let i = 0; i < this.Series.Seasons.length; i++) {
                this.Series.Seasons[i].Order = i;
            }

            await this.mediaService.SaveSeries(this.Series);
        }
    }

    public async SaveSeason() {
        this.EditingSeason!.CommitChanges();
        let newSeason = this.EditingSeason!.TargetObject;
        this.Series!.Seasons!.push(newSeason);

        let id = 0;
        for (let i = 0; i < this.Series!.Seasons!.length; i++) {
            let season = this.Series!.Seasons![i];
            season.Order = i;
            if (season.Id! > id) {
                id = season.Id!;
            }
        }

        id++;
        newSeason.Id = id;

        this.mediaService.SaveSeries(this.Series!);
        this.SeasonAdded.emit(newSeason);
    }

    public CancelEditSeason() {
    }

    public async SaveSeries() {
        this.SeriesUpdated.emit(this.Series!);
        this.EditingSeries = null;
    }

    public CancelSaveSeries() {
        this.EditingSeries = null;
    }
}
