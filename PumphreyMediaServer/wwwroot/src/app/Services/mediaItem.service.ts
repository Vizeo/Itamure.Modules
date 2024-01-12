import { Injectable } from "@angular/core";
import { FileMediaItem, MediaItem, VideoGroup } from "./mediaServer.service";

@Injectable({ providedIn: 'root' })
export class MediaItemService {
    private GetEndIndexOfPath(filePath: string): number {
        let endOfPath = filePath.lastIndexOf("/");
        if (endOfPath == -1) {
            endOfPath = filePath.lastIndexOf("\\");;
        }
        return endOfPath;
    }

    public FindName(fileMediaItem: FileMediaItem): string {
        if (fileMediaItem.Name != null &&
            fileMediaItem.Name.length > 0) {
            return fileMediaItem.Name!;
        }
        else {
            let filePath = fileMediaItem.FilePath!;            
            let extensionIndex = filePath.lastIndexOf(".");
            return filePath.substring(this.GetEndIndexOfPath(filePath), extensionIndex);
        }
    }

    public FindDirectory(fileMediaItem: FileMediaItem): string {
        let filePath = fileMediaItem.FilePath!;
        return filePath.substring(0, this.GetEndIndexOfPath(filePath));
    }

    public MediaItem: MediaItem | null = null;
    public ViewAllVideoGroup: VideoGroup | null = null;
}

export enum SpecialFolders {
    Movies = -1
}