import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Folder, MediaItemType, MediaService, VideoFileMediaItem, Rating, MediaSubType, MetadataTagType, MetadataTag } from '../../Services/mediaServer.service';
import { DraggingVideoFileMedia, IVideoManager } from './videoSettings.component';
import { GlobalService, GroupValidatorBaseDirective, IEditableObject } from 'interLink';
import { SpecialFolders } from '../../Services/mediaItem.service';
import { MetadataService, SearchItem } from '../../Services/metadata.service';
import { MovieMetadataEditorComponent } from './movieMetadataEditor.component';
import { DownloadFile } from '../../Controls/imageUpload.component';
import { MovieVideoComponent } from './movieVideo.component';

@Component({
    selector: 'moviesList',
    templateUrl: './moviesList.component.html',
    styleUrls: ['./moviesList.component.less']
})
export class MoviesListComponent implements IVideoManager {
    constructor(private mediaService: MediaService,
        private metadataService: MetadataService,
        private globalService: GlobalService) {
    }

    private _folder: Folder | null = null;
    private _ratings: Rating[] | undefined;
    private _movieVideoComponent: MovieVideoComponent | null = null;

    @ViewChild("folderDialog")
    private _folderDialog!: ElementRef<HTMLDialogElement>;

    @ViewChild("editor")
    private _editor!: MovieMetadataEditorComponent;

    @ViewChild("metadataDialog")
    private _metadataEditor!: ElementRef<HTMLDialogElement>;

    @ViewChild("metadataSearch")
    private _metadataSearch!: ElementRef<HTMLDialogElement>;

    public MoviesVideoMediaItems: VideoFileMediaItem[] | undefined;
    public FilteredMovieVideoMediaItems: VideoFileMediaItem[] | null = null;
    public Selected: VideoFileMediaItem[] | null = null;
    public Filter: string = "";
    public EditingFolder: (Folder & IEditableObject) | null = null;
    public EditingVideoMediaItem: (VideoFileMediaItem & IEditableObject) | null = null;
    public SelectedSearchItem: SearchItem | null = null;

    private async GetVideoFiles() {
        let folderId = SpecialFolders.Movies;
        if (this._folder != null) {
            folderId = this._folder.Id!;
        }

        this.MoviesVideoMediaItems = await this.mediaService.GetVideoMediaItems(MediaItemType.MovieFile, folderId);
        this.FilteredMovieVideoMediaItems = null; //Reset the filter
    }

    public IsSelected(videoFileMediaItem: VideoFileMediaItem) {
        if (this.Selected != null) {
            return this.Selected.indexOf(videoFileMediaItem) != -1;
        }
        return false;
    }

    @Input("folder")
    public set Folder(value: Folder | null) {
        this._folder = value;
        this.GetVideoFiles();
    }
    public get Folder(): Folder | null{
        return this._folder;
    }

    @Output("dragStarted")
    public DragStarted = new EventEmitter<DraggingVideoFileMedia>();

    @Output("folderAdded")
    public FolderAdded = new EventEmitter<Folder>();

    @Output("folderDeleted")
    public FolderDeleted = new EventEmitter<Folder>();

    public GetFilteredMovieMediaItems(): VideoFileMediaItem[] {
        if (this.FilteredMovieVideoMediaItems == null) {
            if (this.MoviesVideoMediaItems != null &&
                this.MoviesVideoMediaItems.length > 0) {
                const filter = new RegExp(this.Filter
                    .replace("\\", "\\\\")
                    .replace(".", "\\.")
                    .replace("*", ".*"), "i");

                this.FilteredMovieVideoMediaItems = this.MoviesVideoMediaItems!.filter(i =>
                    filter.test(i.FilePath!));
            }
            else {
                this.FilteredMovieVideoMediaItems = this.MoviesVideoMediaItems!;
            }
        }
        return this.FilteredMovieVideoMediaItems!;
    }

    public Select(event: MouseEvent, videoFileMediaItem: VideoFileMediaItem) {
        if (!event.shiftKey &&
            !event.ctrlKey) {
            this.Selected = [videoFileMediaItem];
        }
        else if (event.shiftKey) {
            //Find the first in the list
            let index = -1;
            for (let i = 0; i < this.FilteredMovieVideoMediaItems!.length; i++) {
                let movieVideoMediaItem = this.FilteredMovieVideoMediaItems![i];
                if (this.Selected?.indexOf(movieVideoMediaItem) != -1) {
                    index = i;
                    break;
                }
            }

            if (index != -1) {
                let start = -1;
                let end = -1;

                let newIndex = this.FilteredMovieVideoMediaItems!.indexOf(videoFileMediaItem);
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
                    this.Selected.push(this.FilteredMovieVideoMediaItems![i]);
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
                let index = this.MoviesVideoMediaItems!.indexOf(videoFileMediaItem);
                this.MoviesVideoMediaItems!.splice(index, 1);
                this.FilteredMovieVideoMediaItems = null;
            }
        }
        this.Selected = null;
    }

    public get CanAdd(): boolean {
        return true;
    }

    public get CanEdit(): boolean {
        return this._folder != null;
    }

    public get CanDelete(): boolean {
        return this._folder != null;
    }

    public Add(): void {
        let folder = new Folder();
        folder.ParentId = this.Folder == null ? SpecialFolders.Movies : this.Folder.Id;
        this.EditingFolder = this.globalService.CreateProxy(folder);
        this._folderDialog.nativeElement.showModal();
    }

    public Edit(): void {
        if (this.Folder != null) {
            this.EditingFolder = this.globalService.CreateProxy(this.Folder);
            this._folderDialog.nativeElement.showModal();
        }
    }

    public Delete(): void {
        if (this.Folder != null &&
            confirm("Delete movie folder " + this.Folder.Name + "?\nAll videos will be moved the movies folder.")) {
            this.mediaService.DeleteFolder(this.Folder.Id!);
            this.FolderDeleted.emit(this.Folder);
        }
    }

    public async SaveFolder() {
        this.EditingFolder?.CommitChanges();
        let folder = this.EditingFolder?.TargetObject;
        if (this.EditingFolder?.Id != null) {
            await this.mediaService.UpdateFolder(folder);
        }
        else {
            folder.Id = await this.mediaService.AddFolder(folder);
            this.FolderAdded.emit(folder);
        }
        this.CancelEditFolder();
    }

    public CancelEditFolder() {
        this.EditingFolder = null;
        this._folderDialog.nativeElement.close();
    }

    public CanSaveFolder(): boolean {
        return GroupValidatorBaseDirective.IsValid("folderValidation");
    }

    public ShowMetadataEditor(videoMediaItem: VideoFileMediaItem, movieVideoComponent: MovieVideoComponent) {
        this._movieVideoComponent = movieVideoComponent;
        this.EditingVideoMediaItem = this.globalService.CreateProxy(videoMediaItem);
        this._metadataEditor.nativeElement.showModal();
    }

    public async SaveMetadata() {
        await this._editor.Save();
        this._metadataEditor.nativeElement.close();
        this._movieVideoComponent?.Reload();
        this.EditingVideoMediaItem = null;
        this._movieVideoComponent = null;
    }

    public CloseMetadataEditor() {
        this._metadataEditor.nativeElement.close();
        this._movieVideoComponent?.Reload();
        this.EditingVideoMediaItem = null;
        this._movieVideoComponent = null;
    }

    public MetadataSearch() {
        this._metadataSearch.nativeElement.showModal();
        this.SelectedSearchItem = null;
    }

    public MetadataSelected(metadataSearchResult: SearchItem) {
        this.SelectedSearchItem = metadataSearchResult;
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
                this._ratings = await this.mediaService.GetRatings(MediaSubType.Movies);
            }

            let movieResult = await this.metadataService.GetMovieMetadata(this.SelectedSearchItem.ImdbID!);
            if (movieResult != null) {
                this.EditingVideoMediaItem!.ImdbID = this.SelectedSearchItem.ImdbID;
                this.EditingVideoMediaItem!.Name = movieResult.Title;
                this.EditingVideoMediaItem!.Description = movieResult.Plot;

                let year = Number(movieResult.Year);
                if (!isNaN(year)) {
                    this.EditingVideoMediaItem!.Year = year;
                }

                let actors = this.CreateMetadataTags(MetadataTagType.Actor, movieResult.Actors!);
                let genres = this.CreateMetadataTags(MetadataTagType.Genre, movieResult.Genre!);
                let directors = this.CreateMetadataTags(MetadataTagType.Director, movieResult.Director!);
                let writer = this.CreateMetadataTags(MetadataTagType.Writer, movieResult.Writer!);

                this.EditingVideoMediaItem!.MetadataTags = [...actors, ...genres, ...directors, ...writer];

                for (let i = 0; i < this._ratings.length; i++) {
                    var rating = this._ratings[i];
                    if (rating.Name == movieResult.Rated) {
                        this.EditingVideoMediaItem!.RatingId = rating.Id;
                        break;
                    }
                }

                //Download poster
                var downloadFile = new DownloadFile();
                let image = await fetch(movieResult.Poster!);
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

        //Not updating list value
    }
}
