import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { VideoGroup } from '../../../Services/mediaServer.service';

@Component({
    selector: 'videoGroupingBase',
    template: '',
})
export abstract class VideoGroupBaseComponent {
    constructor() {
    }

    @Input("videoGroup")
    public VideoGroup: VideoGroup | null = null;
}
