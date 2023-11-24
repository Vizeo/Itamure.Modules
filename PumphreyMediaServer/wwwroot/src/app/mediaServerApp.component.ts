import { Component } from '@angular/core';

@Component({
    selector: 'mediaServerApp',
    templateUrl: './mediaServerApp.component.html',
    styleUrls: ['./mediaServerApp.component.less']
})
export class MediaServerAppComponent {
    constructor() {
    }

    public SelectedMenuItem: string = "Movies";

    public SelectMenuItem(name: string) {
        this.SelectedMenuItem = name;
    }

    //Temp
    public ComingSoon() {
        alert("Coming Soon");
    }
}
