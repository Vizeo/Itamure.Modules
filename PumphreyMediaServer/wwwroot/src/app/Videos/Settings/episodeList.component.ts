import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MediaService, MediaSubType, MetadataTag, MetadataTagType, Rating, Season, Series, VideoFileMediaItem } from '../../Services/mediaServer.service';
import { DraggingVideoFileMedia, IVideoManager } from './videoSettings.component';
import { GlobalService, IEditableObject, SortChangeEvent } from 'interLink';
import { SeasonEditorComponent } from './seasonEditor.component';
import { EpisodeVideoComponent } from './episodeVideo.component';
import { MetadataService, SearchItem } from '../../Services/metadata.service';
import { DownloadFile } from '../../Controls/imageUpload.component';
import { EpisodeMetadataEditorComponent } from './episodeMetadataEditor.component';

@Component({
    selector: 'episodeList',
    templateUrl: './episodeList.component.html',
    styleUrls: ['./episodeList.component.less']
})
export class EpisodeListComponent implements IVideoManager {
    constructor(private mediaService: MediaService,
        private metadataService: MetadataService,
        private globalService: GlobalService) {
    }

    @ViewChild("seasonEditor")
    private _seasonEditor: SeasonEditorComponent | null = null;

    @ViewChild("editor")
    private _editor!: EpisodeMetadataEditorComponent;

    @ViewChild("metadataDialog")
    private _metadataEditor!: ElementRef<HTMLDialogElement>;

    @ViewChild("metadataSearch")
    private _metadataSearch!: ElementRef<HTMLDialogElement>;

    private _episodeComponent: EpisodeVideoComponent | null = null;
    private _ratings: Rating[] | undefined;

    public _series: Series | null = null;
    public _season: Season | null = null;
    public EpisodeVideoMediaItems: VideoFileMediaItem[] | undefined;
    public Selected: VideoFileMediaItem[] | null = null;
    public EditingSeason: (Season & IEditableObject) | null = null;
    public SelectedSearchItem: SearchItem | null = null;
    public EditingVideoMediaItem: (VideoFileMediaItem & IEditableObject) | null = null;

    @Input("series")
    public set Series(value: Series | null) {
        this._series = value;
        this.GetEpisodes();
    }
    public get Series(): Series | null {
        return this._series;
    }

    @Input("season")
    public set Season(value: Season | null) {
        this._season = value;
        this.GetEpisodes();
    }
    public get Season(): Season | null {
        return this._season;
    }

    @Output("seasonDeleted")
    public SeasonDeleted = new EventEmitter<Season>();

    private async GetEpisodes() {
        if (this._series != null &&
            this._season != null) {
            if (this._series!.Seasons!.indexOf(this._season!) != -1) {
                this.EpisodeVideoMediaItems = await this.mediaService.GetSeasonMediaItems(this._series!.Id!, this._season!.Id!);
            }
        }
    }

    public IsSelected(videoFileMediaItem: VideoFileMediaItem) {
        if (this.Selected != null) {
            return this.Selected.indexOf(videoFileMediaItem) != -1;
        }
        return false;
    }

    public MetadataSelected(metadataSearchResult: SearchItem) {
        this.SelectedSearchItem = metadataSearchResult;
    }

    public async EpisodeSortChange(event: SortChangeEvent) {
        if (this.EpisodeVideoMediaItems != null) {
            this.EpisodeVideoMediaItems.splice(event.OldIndex, 1);
            this.EpisodeVideoMediaItems.splice(event.NewIndex, 0, event.Item);

            let episodeIds = new Array<number>();

            for (let i = 0; i < this.EpisodeVideoMediaItems.length; i++) {
                let episode = this.EpisodeVideoMediaItems[i];
                episode.Order = i;
                episodeIds.push(episode.Id!);
            }

            await this.mediaService.SetSeasonMediaItemSort(episodeIds);
        }      
    }

    public ShowMetadataEditor(episode: VideoFileMediaItem, episodeComponent: EpisodeVideoComponent) {
        this._episodeComponent = episodeComponent;
        this.EditingVideoMediaItem = this.globalService.CreateProxy(episode);
        this._metadataEditor.nativeElement.showModal();
    }

    public CloseMetadataEditor() {
        this._metadataEditor.nativeElement.close();
        this._episodeComponent?.Reload();
        this.EditingVideoMediaItem = null;
        this._episodeComponent = null;
    }

    public MetadataSearch() {
        this._metadataSearch.nativeElement.showModal();
        this.SelectedSearchItem = null;
    }

    public get CanAdd(): boolean {
        return false;
    }

    public get CanEdit(): boolean {
        return this.Series != null;
    }

    public get CanDelete(): boolean {
        return this.Series != null;
    }

    public Add(): void {
    }

    public Edit(): void {
        this.EditingSeason = this.globalService.CreateProxy(this.Season);
        this._seasonEditor!.Show();
    }

    public Delete(): void {
        if (this.Season != null &&
            confirm("Delete season " + this.Season.Name + "?\nAll videos will be moved the unassigned folder.")) {
            this.mediaService.DeleteSeason(this.Series!.Id!, this.Season.Id!);
            let index = this.Series!.Seasons!.indexOf(this.Season);
            this.Series?.Seasons!.splice(index, 1);
            this.SeasonDeleted.emit(this.Season);
            //Don't need to call SaveSeries
        }
    }

    public async SaveSeason() {
        this.EditingSeason!.CommitChanges();
        for (let i = 0; i < this.Series!.Seasons!.length; i++) {
            let season = this.Series!.Seasons![i];
            season.Order = i;
        }

        this.mediaService.SaveSeries(this.Series!);
    }

    public CancelEditSeason() {
    }

    @Output("dragStarted")
    public DragStarted = new EventEmitter<DraggingVideoFileMedia>();

    public StartDrag(event: DragEvent, videoFileMediaItem: VideoFileMediaItem) {
        if (this.Selected == null ||
            this.Selected.length == 0) {
            this.Selected = [videoFileMediaItem];
        }

        if (event.dataTransfer != null) {
            event.dataTransfer.setData("text/plain", "");
            event.dataTransfer.effectAllowed = "move";
        }

        let draggingVideoFileMedia = new DraggingVideoFileMedia();
        draggingVideoFileMedia.VideoFileMediaItems = this.Selected;
        this.DragStarted.emit(draggingVideoFileMedia);
    }

    public DragEnd(event: DragEvent) {
        event.preventDefault();

        if (event.dataTransfer?.dropEffect != "none") {
            for (let i = 0; i < this.Selected!.length; i++) {
                let videoFileMediaItem = this.Selected![i];
                let index = this.EpisodeVideoMediaItems!.indexOf(videoFileMediaItem);
                this.EpisodeVideoMediaItems!.splice(index, 1);
            }
        }
        this.Selected = null;
    }

    public Select(event: MouseEvent, videoFileMediaItem: VideoFileMediaItem) {
        if (!event.shiftKey &&
            !event.ctrlKey) {
            this.Selected = [videoFileMediaItem];
        }
        else if (event.shiftKey) {
            //Find the first in the list
            let index = -1;
            for (let i = 0; i < this.EpisodeVideoMediaItems!.length; i++) {
                let episodeVideoItem = this.EpisodeVideoMediaItems![i];
                if (this.Selected?.indexOf(episodeVideoItem) != -1) {
                    index = i;
                    break;
                }
            }

            if (index != -1) {
                let start = -1;
                let end = -1;

                let newIndex = this.EpisodeVideoMediaItems!.indexOf(videoFileMediaItem);
                if (newIndex < index) {
                    start = newIndex;
                    end = index;
                }
                else {
                    start = index;
                    end = newIndex;
                }

                this.Selected = new Array<VideoFileMediaItem>();
                for (var i = start; i <= end; i++) {
                    this.Selected.push(this.EpisodeVideoMediaItems![i]);
                }
            }
            else {
                this.Selected = [videoFileMediaItem];
            }
        }
        else if (event.ctrlKey) {
            if (this.Selected == null ||
                this.Selected.length == 0) {
                this.Selected = [videoFileMediaItem];
            }
            else {
                let index = this.Selected.indexOf(videoFileMediaItem);
                if (index == -1) {
                    this.Selected.push(videoFileMediaItem);
                }
                else {
                    this.Selected.splice(index, 1);
                }
            }
        }
    }

    private CreateMetadataTags(metadataTagType: MetadataTagType, list: string): MetadataTag[] {
        var result = new Array<MetadataTag>();
        let data = list.split(",");
        for (let i = 0; i < data.length; i++) {
            let metadataTag = new MetadataTag();
            metadataTag.MetadataTagType = metadataTagType;
            metadataTag.Value = data[i].trim();
            result.push(metadataTag);
        }
        return result;
    }

    public async StoreSearchedMetadata() {
        if (this.SelectedSearchItem != null) {
            if (this._ratings == null) {
                this._ratings = await this.mediaService.GetRatings(MediaSubType.Series);
            }

            let episodeResult = await this.metadataService.GetEpisodeMetadata(this.SelectedSearchItem.ImdbID!);
            if (episodeResult != null) {
                this.EditingVideoMediaItem!.ImdbID = this.SelectedSearchItem.ImdbID;
                this.EditingVideoMediaItem!.Name = episodeResult.Title;
                this.EditingVideoMediaItem!.Description = episodeResult.Plot;

                let actors = this.CreateMetadataTags(MetadataTagType.Actor, episodeResult.Actors!);
                let genres = this.CreateMetadataTags(MetadataTagType.Genre, episodeResult.Genre!);
                let directors = this.CreateMetadataTags(MetadataTagType.Director, episodeResult.Director!);
                let writer = this.CreateMetadataTags(MetadataTagType.Writer, episodeResult.Writer!);

                this.EditingVideoMediaItem!.MetadataTags = [...actors, ...genres, ...directors, ...writer];

                for (let i = 0; i < this._ratings.length; i++) {
                    var rating = this._ratings[i];
                    if (rating.Name == episodeResult.Rated) {
                        this.EditingVideoMediaItem!.RatingId = rating.Id;
                        break;
                    }
                }

                //Download poster
                var downloadFile = new DownloadFile();
                let image = await fetch(episodeResult.Poster!);
                let blob = await image.blob();
                downloadFile.Type = image.headers.get("content-type")!;
                let reader = new FileReader();
                reader.onloadend = () => {
                    downloadFile.Data = <ArrayBuffer>reader.result;
                    this._editor.SetImage(downloadFile)
                }
                reader.readAsDataURL(blob);
            }
        }
    }

    public async SaveMetadata() {
        await this._editor.Save();
        this._metadataEditor.nativeElement.close();
        this._episodeComponent?.Reload();
        this.EditingVideoMediaItem = null;
        this._episodeComponent = null;
    }
}
