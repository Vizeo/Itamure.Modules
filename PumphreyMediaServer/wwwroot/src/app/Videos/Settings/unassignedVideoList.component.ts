import { Component, EventEmitter, Output } from '@angular/core';
import { MediaService, VideoFileMediaItem } from '../../Services/mediaServer.service';
import { DraggingVideoFileMedia, IVideoManager } from './videoSettings.component';

@Component({
    selector: 'unassignedVideoList',
    templateUrl: './unassignedVideoList.component.html',
    styleUrls: ['./unassignedVideoList.component.less']
})
export class UnassignedVideoListComponent implements IVideoManager {
    constructor(private mediaService: MediaService) {
        this.GetUnassignedVideoFiles();
    }

    public UnassignedVideoMediaItems: VideoFileMediaItem[] | undefined;
    public FilteredUnknownVideoMediaItems: VideoFileMediaItem[] | null = null;
    public Selected: VideoFileMediaItem[] | null = null;
    public Filter: string = "";

    private async GetUnassignedVideoFiles() {
        this.UnassignedVideoMediaItems = await this.mediaService.GetUnassignedVideoMediaItems();
    }

    public IsSelected(videoFileMediaItem: VideoFileMediaItem) {
        if (this.Selected != null) {
            return this.Selected.indexOf(videoFileMediaItem) != -1;
        }
        return false;
    }

    @Output("dragStarted")
    public DragStarted = new EventEmitter<DraggingVideoFileMedia>();

    public GetFilteredUnknownVideoMediaItems(): VideoFileMediaItem[] {
        if (this.FilteredUnknownVideoMediaItems == null) {
            if (this.UnassignedVideoMediaItems != null &&
                this.UnassignedVideoMediaItems.length > 0) {
                const filter = new RegExp(this.Filter
                    .replace("\\", "\\\\")
                    .replace(".", "\\.")
                    .replace("*", ".*"), "i");

                this.FilteredUnknownVideoMediaItems = this.UnassignedVideoMediaItems!.filter(i =>
                    filter.test(i.FilePath!));
            }
            else {
                this.FilteredUnknownVideoMediaItems = this.UnassignedVideoMediaItems!;
            }
        }
        return this.FilteredUnknownVideoMediaItems!;
    }

    public ResetFilter() {
        this.FilteredUnknownVideoMediaItems = null;
    }

    public Select(event: MouseEvent, videoFileMediaItem: VideoFileMediaItem) {
        if (!event.shiftKey &&
            !event.ctrlKey) {
            this.Selected = [videoFileMediaItem];
        }
        else if (event.shiftKey) {
            //Find the first in the list
            let index = -1;
            for (let i = 0; i < this.FilteredUnknownVideoMediaItems!.length; i++) {
                let unknownVideoMediaItem = this.FilteredUnknownVideoMediaItems![i];
                if (this.Selected?.indexOf(unknownVideoMediaItem) != -1) {
                    index = i;
                    break;
                }
            }

            if (index != -1) {
                let start = -1;
                let end = -1;

                let newIndex = this.FilteredUnknownVideoMediaItems!.indexOf(videoFileMediaItem);
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
                    this.Selected.push(this.FilteredUnknownVideoMediaItems![i]);
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
                let index = this.UnassignedVideoMediaItems!.indexOf(videoFileMediaItem);
                this.UnassignedVideoMediaItems!.splice(index, 1);
                this.FilteredUnknownVideoMediaItems = null;
            }
        }
        this.Selected = null;
    }

    public get CanAdd(): boolean {
        return false;
    }

    public get CanEdit(): boolean {
        return false
    }

    public get CanDelete(): boolean {
        return false
    }

    public Add(): void {

    }

    public Edit(): void {

    }

    public Delete(): void {

    }
}
