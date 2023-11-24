import { Component, ViewChild } from '@angular/core';
import { Folder, MediaService, Season, Series, VideoFileMediaItem } from '../../Services/mediaServer.service';
import { SpecialFolders } from '../../Services/mediaItem.service';
import { ExpanderComponent } from 'interLink';

@Component({
    selector: 'videoSettings',
    templateUrl: './videoSettings.component.html',
    styleUrls: ['./videoSettings.component.less']
})
export class VideoSettingComponent {
    constructor(private mediaService: MediaService,) {
    }

    private _dragAreaCount: number = 0;

    @ViewChild("videoManager")
    private _videoManager: IVideoManager | undefined;

    public ManagerViewType = ManagerViewType;
    public SpecialFolders = SpecialFolders;
    public ParentFolders = ParentFolders;
    public SelectedManagerViewType: ManagerViewType | null = null;
    public Selected: Selectable | null = null
    public DraggingOver: Selectable | null = null
    public MovieFolders: FolderEx[] | null = null;
    public Serieses: (Series & IImage)[] | undefined;
    public Seasons: Season[] | undefined;
    public CurrentDraggingVideoFileMedia: DraggingVideoFileMedia | null = null;
    public Folder: FolderEx | null = null;
    public Series: Series | null = null;
    public Season: Season | null = null;

    public get CanAdd(): boolean {
        return this._videoManager != null &&
            this._videoManager.CanAdd;
    }

    public get CanEdit(): boolean {
        return this._videoManager != null &&
            this._videoManager.CanEdit;
    }

    public get CanDelete(): boolean {
        return this._videoManager != null &&
            this._videoManager.CanDelete;
    }

    public Add(): void {
        this._videoManager?.Add();
    }

    public Edit(): void {
        this._videoManager?.Edit();
    }

    public Delete(): void {
        this._videoManager?.Delete();
    }

    public ShowUnassigned() {
        this.Selected = ParentFolders.Unassigned;
        this.SelectedManagerViewType = ManagerViewType.Unassigned;
    }

    public async ShowMovies(folder: FolderEx | null) {
        this.Folder = folder;
        if (folder == null) {
            this.Selected = ParentFolders.Movies;
            if (this.MovieFolders == null) {
                this.MovieFolders = <FolderEx[]>await this.mediaService.GetFolders(SpecialFolders.Movies);
            }
        }
        else {
            this.Selected = folder;
            if (folder.Folders == null) {
                folder.Folders = <FolderEx[]>await this.mediaService.GetFolders(folder.Id!);
                folder.Folders.forEach(f => f.Parent = folder);
            }
        }

        this.SelectedManagerViewType = ManagerViewType.Movies;
    }

    public async MoviesDrop(event: DragEvent, folder: FolderEx | null) {
        event.preventDefault();
        this.DraggingOver = null;

        let ids = new Array<number>();
        for (let i = 0; i < this.CurrentDraggingVideoFileMedia!.VideoFileMediaItems!.length; i++) {
            ids.push(this.CurrentDraggingVideoFileMedia!.VideoFileMediaItems![i].Id!);
        }

        if (folder == null) {
            await this.mediaService.AssignVideoToMovies(ids, SpecialFolders.Movies);
        }
        else {
            await this.mediaService.AssignVideoToMovies(ids, folder.Id!);
        }
    }

    public MediaDragStart(currentDraggingVideoFileMedia: DraggingVideoFileMedia) {
        this._dragAreaCount = 0;
        this.DraggingOver = null;
        this.CurrentDraggingVideoFileMedia = currentDraggingVideoFileMedia;
    }

    public async SeasonDrop(event: DragEvent, seriesId: number, seasonId: number) {
        event.preventDefault();
        this.DraggingOver = null;

        let ids = new Array<number>();
        for (let i = 0; i < this.CurrentDraggingVideoFileMedia!.VideoFileMediaItems!.length; i++) {
            ids.push(this.CurrentDraggingVideoFileMedia!.VideoFileMediaItems![i].Id!);
        }

        await this.mediaService.AssignVideoToSeason(seriesId,  seasonId, ids);
    }

    public DragOver(event: DragEvent) {
        if (event.dataTransfer != null) {
            event.preventDefault();
        }
    }

    public DragEnter(event: DragEvent, selectable: Selectable) {
        //TODO: Fix
        if (this._dragAreaCount == 0) {
            if (event.dataTransfer != null) {
                this.DraggingOver = selectable;
            }
             this._dragAreaCount++;
        }
        event.preventDefault();
    }

    public DragLeave(event: DragEvent, selectable: Selectable) {
        //TODO: Fix
        if (this._dragAreaCount == 0) {
            if (selectable == this.DraggingOver) {
                this.DraggingOver = null;
            }
        }
        else {
            this._dragAreaCount--;
        }
        event.preventDefault();
    }

    public MovieFolderAdded(folder: Folder) {
        let folders;
        if (this.Folder == null) {
            folders = this.MovieFolders;
        }
        else {
            folders = this.Folder.Folders;
            (<FolderEx>folder).Parent = this.Folder;
        }

        folders!.push(<FolderEx>folder);
        folders!.sort((a, b) => {
            if (a.Name! < b.Name!) return -1;
            if (a.Name! > b.Name!) return 1;
            return 0;
        });
    }

    public MovieFolderDeleted(folder: Folder) {
        let folders;
        if (folder.ParentId == SpecialFolders.Movies) {
            folders = this.MovieFolders;
        }
        else {
            folders = (<FolderEx>folder).Parent!.Folders;
        }
        var index = folders?.indexOf(<FolderEx>folder);
        folders?.splice(index!, 1);
        if (this.Selected == folder) {
            this.Selected = null;
            this.Folder = null;
            this.SelectedManagerViewType = null;
        }
    }

    public SeasonDeleted(season: Season) {
        if (season == this.Selected) {
            this.ShowSeasons(this.Series!);
        }
    }

    public SetExpanded(event: MouseEvent, expander: ExpanderComponent, value: boolean) {
        event.stopPropagation();
        expander.Expanded = value;
    }

    public async ShowSeries() {
        this.SelectedManagerViewType = ManagerViewType.Series;
        this.Selected = ParentFolders.Series;
        if (this.Serieses == null) {
            this.Serieses = await this.mediaService.GetSeriesList();
            for (let i = 0; i < this.Serieses.length; i++) {
                let series = this.Serieses[i];
                this.GetSeriesImage(series);
            }
        }
    }

    public SeriesAdded(series: Series) {
        this.Serieses?.unshift(series);
        this.Serieses?.sort((a, b) => {
            if (a.Name! < b.Name!) return -1;
            if (a.Name! > b.Name!) return 1;
            return 0;
        });

        this.ShowSeasons(series);
    }

    public SeriesDeleted(series: Series) {
        var index = this.Serieses!.indexOf(series);
        this.Serieses!.splice(index, 1);
        this.Series = null;
        this.Selected = ParentFolders.Series;
    }

    public SeriesUpdated(series: Series) {
        this.GetSeriesImage(series);
    }

    public async SeasonAdded(season: Season) {
        this.Selected = season;
        this.Season = season;
        this.SelectedManagerViewType = ManagerViewType.Season;
    }

    public async ShowSeasons(series: Series) {
        this.Selected = series;
        this.Series = series;
        this.SelectedManagerViewType = ManagerViewType.Seasons;
    }

    public async ShowSeason(season: Season) {
        this.Selected = season;
        this.Season = season;
        this.SelectedManagerViewType = ManagerViewType.Season;
    }

    private GetSeriesImage(series: Series & IImage) {
        series.Image = "/mediaServer/api/mediaServerService/GetSeriesImage?seriesId=" + series!.Id! + "&date=" + (new Date().getTime());
    }

    public ImageSeriesError(imageSource: IImage) {
        imageSource.Image = "/MediaServer/assets/UnknownMedia.svg";
    }
}

type Selectable = Series | Season | ParentFolders;

class FolderEx extends Folder {
    public Folders: FolderEx[] | undefined;
    public Parent: FolderEx | undefined;
}

export interface IImage {
    Image?: string;
}

export class DraggingVideoFileMedia {
    public VideoFileMediaItems: VideoFileMediaItem[] | undefined;
}

export interface IVideoManager 
{
    get CanAdd(): boolean;
    get CanEdit(): boolean;
    get CanDelete(): boolean;
    Add(): void;
    Edit(): void;
    Delete(): void;
}

enum ParentFolders {
    Unassigned,
    Movies,
    Series
}

enum ManagerViewType {
    Unassigned,
    Movies,
    Series,
    Seasons,
    Season
}