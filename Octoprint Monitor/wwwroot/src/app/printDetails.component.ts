import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { OctoprintMonitorService, PrinterInfo } from './services/octoprintMonitor.service';
// @ts-ignore
import * as THREE from 'three';
// @ts-ignore
import { WebGLPreview } from 'gcode-preview';

@Component({
    selector: 'printDetails',
    templateUrl: './printDetails.component.html',
    styleUrls: ['./printDetails.component.less']
})
export class PrintDetailComponent {
    constructor(private octoprintMonitorService: OctoprintMonitorService) {
        let params = (new URL(document.location.href)).searchParams;
        this._printerId = Number(params.get("printerId"));

        //console.log("tet", window.frameElement, (<any>window.frameElement).GCode);
    }    

    private context: HTMLCanvasElement | undefined;

    @ViewChild('myCanvas', { static: false })
    canvas: ElementRef | undefined;

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.preview.camera.aspect = window.innerWidth / window.innerHeight;
        this.preview.camera.updateProjectionMatrix();
        this.preview.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public preview: any;

    private _printerId: number | null;

    public ngAfterViewInit() {
        //window.addEventListener("OctoprintMonitor.PrinterStatusUpdated", (u) => this.Received((<CustomEvent>u).detail));

        this.context = (this.canvas!.nativeElement as HTMLCanvasElement);

        this.preview = new WebGLPreview({
            canvas: this.context,
            topLayerColor: new THREE.Color('lime').getHex(),
            lastSegmentColor: new THREE.Color('red').getHex(),
            //buildVolume: { x: 180, y: 180, z: 180 },
            initialCameraPosition: [0, 400, 450],
            allowDragNDrop: false,
        });

        this.preview.processGCode((<any>window.frameElement).GCode);
    }
}
