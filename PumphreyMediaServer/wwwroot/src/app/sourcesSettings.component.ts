import { Component } from '@angular/core';
import { MediaService, MediaSource, DirectoryMediaSource, MediaSourceType, OmdbApiData } from './Services/mediaServer.service';

@Component({
    selector: 'sourcesSettings',
    templateUrl: './sourcesSettings.component.html',
    styleUrls: ['./sourcesSettings.component.less']
})
export class SourcesSettingsComponent {
    constructor(private mediaService: MediaService) {
        this.GetMediaSources();
        this.NewDirectoryMediaSource = this.SetupMediaSource();
        this.GetSettings();
    }

    private _apiKey: string | null = null;

    public MediaSources: MediaSource[] | undefined;
    public NewDirectoryMediaSource: DirectoryMediaSource;
    public DirectoryValidated: boolean = false;
    public PathTouched: boolean = false;
    public NameTouched: boolean = false;

    public get ApiKey(): string | null {
        return this._apiKey;
    }
    public set ApiKey(val: string | null) {
        this._apiKey = val;
    }

    public async UpdateKey() {
        let apiData = new OmdbApiData();
        apiData.Key = this._apiKey;
        await this.mediaService.SetOmdbApiKey(apiData);
    }

    public async GetSettings() {
        var omdbData = await this.mediaService.GetOmdbApiKey();
        this._apiKey = omdbData.Key!;
    }

    public async GetMediaSources() {
        this.MediaSources = await this.mediaService.GetSources();
    }

    public async AddDirectoryMediaSource() {
        this.MediaSources?.unshift(await this.mediaService.AddMediaSource(this.NewDirectoryMediaSource!));
        this.NewDirectoryMediaSource = this.SetupMediaSource();

        this.NameTouched = false;
        this.DirectoryValidated = false;
        this.PathTouched = false;
    }

    public async ValidateDirectory(path: string): Promise<boolean> {
        return await this.mediaService.ValidateDirectory(path);
    }

    public CanAddDirectoryMediaSource(): boolean {
        return this.DirectoryValidated &&
            this.NameValid();
    }

    //This is meant to be expanded for other media sources in the future
    private SetupMediaSource(): DirectoryMediaSource {
        let result = new DirectoryMediaSource();
        result.MediaSourceType = MediaSourceType.Directory;
        return result;
    }

    public DirectorySourceFocus() {
        this.DirectoryValidated = false;
    }

    public async DirectorySourceBlur() {
        this.DirectoryValidated = await this.mediaService.ValidateDirectory(this.NewDirectoryMediaSource?.Path!);
        this.PathTouched = true;
    }

    public async RemoveMediaSource(mediaSource: MediaSource) {
        if (confirm("Delete media source " + mediaSource.Name + "?")) {
            await this.mediaService.RemoveSource(mediaSource);
            if (this.MediaSources != null) {
                const index = this.MediaSources.indexOf(mediaSource);
                this.MediaSources?.splice(index, 1);
            }
        }
    }

    public NameValid(): boolean {
        return this.NewDirectoryMediaSource.Name != null &&
            this.NewDirectoryMediaSource.Name.length >= 3;
    }

    public NameSourceBlur() {
        this.NameTouched = true;
    }
}
