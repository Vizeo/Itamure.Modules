import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MediaService, MediaSubType, Rating, Series, Tag } from '../../Services/mediaServer.service';
import { GlobalService, GroupValidatorBaseDirective, IEditableObject } from 'interLink';
import { DownloadFile, ImageUploadComponent } from '../../Controls/imageUpload.component';
import { MetadataService, SearchItem, SearchResult } from '../../Services/metadata.service';

@Component({
    selector: 'seriesEditor',
    templateUrl: './seriesEditor.component.html',
    styleUrls: ['./seriesEditor.component.less']
})
export class SeriesEditorComponent {
    constructor(private mediaService: MediaService,
        private metadataService: MetadataService,
        private globalService: GlobalService) {
        this.GetPropertyOptions();
    }

    public static Ratings: Rating[] | undefined;
    public static Tags: Tag[] | undefined;

    private _series: (Series & IEditableObject) | null = null;

    public Image: string = "";
    public Search: string = "";
    public DownloadFile: DownloadFile | null = null;
    public SelectedSearchItem: SearchItem | null = null;
    public SearchResult: SearchResult | null = null;

    @Input("series")
    public get Series(): Series | null {
        return this._series;
    }
    public set Series(val: Series | null) {
        if (val != null) {
            this._series = this.globalService.CreateProxy(val);
            this.Search = val != null ? val.Name! : "";
            this.GetImage();
        }
        else {
            this._series = null;
        }
    }

    @Output("saved")
    public Saved = new EventEmitter();

    @Output("canceled")
    public Canceled = new EventEmitter();

    @ViewChild("seriesDialog")
    private _seriesDialog!: ElementRef<HTMLDialogElement>;

    @ViewChild("imageUpload")
    private _imageUpload: ImageUploadComponent | undefined;

    public get Ratings(): Rating[] | undefined {
        return SeriesEditorComponent.Ratings;
    }

    public get Tags(): Tag[] | undefined {
        return SeriesEditorComponent.Tags;
    }

    public async GetPropertyOptions() {
        if (SeriesEditorComponent.Ratings == null) {
            SeriesEditorComponent.Ratings = await this.mediaService.GetRatings(MediaSubType.Series);
        }

        if (SeriesEditorComponent.Tags == null) {
            SeriesEditorComponent.Tags = await this.mediaService.GetTags(MediaSubType.Series);
        }
    }

    private async GetImage() {
        if (this._series != null &&
            this._series.Id != null) {
            this.Image = "/mediaServer/api/mediaServerService/GetSeriesImage?seriesId=" + this._series.Id + "&date=" + (new Date().getTime());;
        }
    }

    public Show() {
        this._seriesDialog.nativeElement.showModal();
    }

    public CanSave(): boolean {
        return GroupValidatorBaseDirective.IsValid("seriesValidation");
    }

    public ImageDropped(downloadFile: DownloadFile) {
        this.DownloadFile = downloadFile;
    }

    public async SearchDatabase() {
        this.SearchResult = await this.metadataService.SeriesSearch(this.Search);
    }

    public async SelectSearchItem() {
        let seriesResult = await this.metadataService.GetSeriesMetadata(this.SelectedSearchItem!.ImdbID!);
        if (seriesResult != null) {
            this._series!.Name = seriesResult.Title;
            this._series!.Description = seriesResult.Plot;

            for (let i = 0; i < this.Ratings!.length; i++) {
                var rating = this.Ratings![i];
                if (rating.Name == seriesResult.Rated) {
                    this._series!.RatingId = rating.Id;
                    break;
                }
            }

            //Download poster
            var downloadFile = new DownloadFile();
            let image = await fetch(seriesResult.Poster!);
            let blob = await image.blob();
            downloadFile.Type = image.headers.get("content-type")!;
            let reader = new FileReader();
            reader.onloadend = () => {
                downloadFile.Data = <ArrayBuffer>reader.result;
                this.DownloadFile = downloadFile;
                this._imageUpload?.ShowDownloadFile(downloadFile);
            }
            reader.readAsDataURL(blob);
        }
    }

    public Cancel() {
        this.Canceled.emit();
        this._seriesDialog.nativeElement.close();
    }

    public async Save() {
        if (this._series?.Modified) {
            this._series.CommitChanges();
            let series = <Series>this._series.TargetObject;
            if (this._series.Id == null) {
                let seriesResponse = await this.mediaService.AddSeries(series);
                if (seriesResponse.Success) {
                    series = seriesResponse.Series!;
                    this._series.Id = series.Id
                    this._series.Description = series.Description
                    this._series.Name = series.Name
                    this._series.RatingId = series.RatingId
                    this._series.Seasons = series.Seasons
                    this._series.CommitChanges();
                }
                else {
                    alert(seriesResponse.Message);
                }
            }
            else {
                await this.mediaService.SaveSeries(series);
            }
        }

        if (this.DownloadFile != null) {
            await this.mediaService.SetSeriesImage(this._series!.Id!, null, this.DownloadFile!.Data!)
        }
        this.DownloadFile = null;

        this.Saved.emit();
        this._seriesDialog.nativeElement.close();
    }
}
