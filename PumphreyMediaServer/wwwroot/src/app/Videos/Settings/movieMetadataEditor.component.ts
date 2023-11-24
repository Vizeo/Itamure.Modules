import { Component, Input, ViewChild } from '@angular/core';
import { MediaService, MediaSubType, Rating, Tag, VideoFileMediaItem } from '../../Services/mediaServer.service';
import { DownloadFile, ImageUploadComponent } from '../../Controls/imageUpload.component';
import { GroupValidatorBaseDirective, IEditableObject } from 'interLink';

@Component({
    selector: 'movieMetadataEditor',
    templateUrl: './movieMetadataEditor.component.html',
    styleUrls: ['./movieMetadataEditor.component.less']
})
export class MovieMetadataEditorComponent {
    constructor(private mediaService: MediaService) {
        this.GetPropertyOptions();
    }

    public static Ratings: Rating[] | undefined;
    public static Tags: Tag[] | undefined;

    private _editableVideoFileMediaItem: (VideoFileMediaItem & IEditableObject) | null = null;
    private _downloadFile: DownloadFile | null = null;

    public Image: string = "";

    @ViewChild("imageUpload")
    private _imageUpload: ImageUploadComponent | undefined;

    @Input("video")
    public set VideoFileMediaItem(val: (VideoFileMediaItem & IEditableObject) | null) {
        this._editableVideoFileMediaItem = val;
        this.GetImage();
        this._downloadFile = null;
    }
    public get VideoFileMediaItem(): (VideoFileMediaItem & IEditableObject) | null {
        return this._editableVideoFileMediaItem;
    }

    private async GetImage() {
        if (this._editableVideoFileMediaItem != null) {
            this.Image = "/mediaServer/api/mediaServerService/GetVideoFileMediaItemImage?mediaItemId=" + this._editableVideoFileMediaItem!.Id!;
        }
    }

    public CanSave(): boolean {
        return this._downloadFile != null ||
            (this._editableVideoFileMediaItem != null &&
                this._editableVideoFileMediaItem!.Modified) &&
            GroupValidatorBaseDirective.IsValid("movieValidation");
    }

    public async Save() {
        if (this._editableVideoFileMediaItem!.Modified) {
            this._editableVideoFileMediaItem!.CommitChanges();
            await this.mediaService.SetVideoFileMediaMetadata(this._editableVideoFileMediaItem!);
        }

        if (this._downloadFile != null &&
            this._downloadFile.Data != null) {
            await this.mediaService.SetVideoFileMediaItemImage(this._editableVideoFileMediaItem!.Id!, this._downloadFile.Type!, this._downloadFile.Data);
        }
    }

    public get Ratings(): Rating[] | undefined {
        return MovieMetadataEditorComponent.Ratings;
    }

    public get Tags(): Tag[] | undefined {
        return MovieMetadataEditorComponent.Tags;
    }

    public async GetPropertyOptions() {
        if (MovieMetadataEditorComponent.Ratings == null) {
            MovieMetadataEditorComponent.Ratings = await this.mediaService.GetRatings(MediaSubType.Movies);
        }

        if (MovieMetadataEditorComponent.Tags == null) {
            MovieMetadataEditorComponent.Tags = await this.mediaService.GetTags(MediaSubType.Movies);
        }
    }

    public ImageDropped(downloadFile: DownloadFile) {
        this._downloadFile = downloadFile;
    }

    public SetImage(downloadFile: DownloadFile) {
        this._downloadFile = downloadFile;
        this._imageUpload?.ShowDownloadFile(downloadFile);
    }
}
