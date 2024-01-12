import { Component } from '@angular/core';
import { Access, MediaService } from './Services/mediaServer.service';

@Component({
    selector: 'mediaServerSettings',
    templateUrl: './mediaServerSettings.component.html',
    styleUrls: ['./mediaServerSettings.component.less']
})
export class MediaServerSettingsComponent {
    constructor(mediaService: MediaService) {
        mediaService.GetAccess().then(a => this.Access = a);
    }

    public SelectedMenuItem: string = "";
    public Access?: Access;

    public SelectMenuItem(name: string) {
        this.SelectedMenuItem = name;
    }
}
