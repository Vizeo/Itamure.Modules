import { Component } from '@angular/core';
import { MediaFileType, MediaService, MediaType } from './Services/mediaServer.service';

@Component({
    selector: 'mediaFileTypesSetting',
    templateUrl: './mediaFileTypesSetting.component.html',
    styleUrls: ['./mediaFileTypesSetting.component.less']
})
export class MediaFileTypesSettingComponent {
    constructor(private mediaService: MediaService) {
        this.GetMediaFileTypes();
        this.NewMediaFileType = new MediaFileType();
    }

    public MediaFileTypes: MediaFileType[] | undefined;
    public NewMediaFileType: MediaFileType;

    public Audio = MediaType.Audio;
    public Image = MediaType.Image;
    public Video = MediaType.Video;

    public GetName(mediaType: MediaType) {
        return MediaType[<any>mediaType];
    }

    //TODO: enforce patterns
    //Add direction arrow
    //add highlighting

    public CanAddMediaFileType(): boolean {
        //TODO: Use validators
        return this.NewMediaFileType!.FileExtension?.length! > 0 &&
            this.NewMediaFileType!.ContentType?.length! > 0 &&
            this.NewMediaFileType!.MediaType != MediaType.Unknown;
    }

    public Sort(property: string) {
        if (this.MediaFileTypes != null) {
            this.MediaFileTypes.sort((a: any, b: any) => {
                let av = a[property];
                let ab = b[property];

                if (av < ab) return -1;
                else if (av > ab) return 1;
                return 0;
            });
        }
    }

    public async AddMediaFileType() {
        var real = await this.mediaService.AddMediaFileType(this.NewMediaFileType);
        this.MediaFileTypes?.unshift(real);
        this.NewMediaFileType = new MediaFileType();
    }

    public RemoveMediaFileType(mediaFileType: MediaFileType) {
        if (confirm("Remove media file type \"" + mediaFileType.FileExtension + "\"?")) {
            this.mediaService.RemoveMediaFileType(mediaFileType.Id!);
            const index = this.MediaFileTypes?.indexOf(mediaFileType);
            this.MediaFileTypes?.splice(index!, 1);
        }
    }

    private async GetMediaFileTypes() {
        this.MediaFileTypes = await this.mediaService.GetMediaFileTypes();
    }
}
