import { Component } from '@angular/core';

@Component({
    selector: 'mediaServerSettings',
    templateUrl: './mediaServerSettings.component.html',
    styleUrls: ['./mediaServerSettings.component.less']
})
export class MediaServerSettingsComponent {
    constructor() {
    }

    public SelectedMenuItem: string = "";

    public SelectMenuItem(name: string) {
        this.SelectedMenuItem = name;
    }
}
