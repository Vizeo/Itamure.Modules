import { Component } from '@angular/core';
import { VideoGroupBaseComponent } from './videoGroupBase.component';
import { MediaService, FolderTree } from '../../../Services/mediaServer.service';

@Component({
    selector: 'folderVideoGroup',
    templateUrl: './folderVideoGroup.component.html',
    styleUrls: ['./folderVideoGroup.component.less']
})
export class FolderVideoGroupComponent extends VideoGroupBaseComponent {
    constructor(private mediaService: MediaService) {
        super();

        this.GetFolders();
    }   

    private _selectedFolderId?: number;
    public Folders: Folder[] = new Array<Folder>();

    public get SelectedFolderId(): number | undefined {
        return this._selectedFolderId;
    }

    public set SelectedFolderId(val: number | undefined) {
        this._selectedFolderId = val;
        let options = new Options();
        options.FolderId = val;
        this.VideoGroup!.Options = JSON.stringify(options);
    }

    public ngAfterViewInit() {
        if (this.VideoGroup != null &&
            this.VideoGroup.Options != null) {
            let options = <Options>JSON.parse(this.VideoGroup.Options);
            this._selectedFolderId = options.FolderId;
        }
    }

    private async GetFolders() {
        let folderTree = await this.mediaService.GetVideoFolders();
        this.RecursiveFolderListBuilder(folderTree, "");
    }

    private RecursiveFolderListBuilder(folderTree: FolderTree[], depth: string) {
        for (let i = 0; i < folderTree.length; i++) {
            let fTree = folderTree[i];
            let folder = new Folder();
            folder.Id = fTree.Id;
            folder.Name = fTree.Name!;
            this.Folders.push(folder);

            this.RecursiveFolderListBuilder(fTree.SubFolders!, depth + "-")
        }
    }
}

class Folder {
    public Id?: number;
    public Name?: string;
}

class Options {
    public FolderId?: number;
}
