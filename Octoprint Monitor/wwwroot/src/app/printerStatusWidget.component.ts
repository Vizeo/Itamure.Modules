import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
// @ts-ignore
//import * as THREE from 'three';
//// @ts-ignore
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
import { WebGLPreview } from 'gcode-preview';

@Component({
    selector: 'printerStatusWidget',
    templateUrl: './printerStatusWidget.component.html',
    styleUrls: ['./printerStatusWidget.component.less']
})
export class PrinterStatusWidgetComponent {
    constructor(private domSanitizer: DomSanitizer) {
        let params = (new URL(document.location.href)).searchParams;
        this._printerId = Number(params.get("printerId"));
    }

    private context: HTMLCanvasElement | undefined;

    @ViewChild('myCanvas', { static: false })
    Canvas: ElementRef | undefined;

    @ViewChild('thumbnail', { static: false })
    Thumbnail: HTMLImageElement | undefined;

    private _preview: any;
    public PrinterState: PrinterState | null = null;

    private _downloadedFile: string | null = null;
    private _printerId: number | null;
    private _gcode: string | null = null;

    public ShowWindow() {
        if (this.IsOnline() &&
            this.PrinterState != null) {
            let iframeWindow: HTMLIFrameElement = (<any>window).showWindow(this.PrinterState.Name, "/OctoprintMonitor/PrinterDetails?printerId=" + this._printerId, { Center: true });
            if (iframeWindow != null) {
                (<any>iframeWindow).GCode = this._gcode;
            }
        }
    }

    public ngAfterViewInit() {
        window.addEventListener("OctoprintMonitor.PrinterStatusUpdated", (u) => this.Received((<CustomEvent>u).detail));

        this.context = (this.Canvas!.nativeElement as HTMLCanvasElement);

        this._preview = new WebGLPreview({
            canvas: this.context,
            initialCameraPosition: [0, 400, 450],
            allowDragNDrop: false,
        });
    }   

    private async Received(data: PrinterState) {
        if (this._printerId == data.PrinterId) {
            this.PrinterState = data;
            if (this.IsOnline())
            {
                if (this._downloadedFile != this.PrinterState.FileName) {
                    this._downloadedFile = this.PrinterState.FileName!;

                    const url = "/OctoprintMonitor/Api/OctoprintMonitorService/GetCurrentGCode?printerId=" + this.PrinterState.PrinterId;

                    const response = await fetch(url);
                    if (response.status !== 200) {
                        console.error('ERROR. Status Code: ' + response.status);
                        return;
                    }

                    this._gcode = await response.text();

                    this._preview.parser.parseGCode(this._gcode);
                    let thumb = this._preview.parser.metadata.thumbnails['220x124'];

                    if (this.Thumbnail != null) {
                        if (thumb != null) {
                            //Can't figure out how to get this to work in angular so using javascript below
                            //this.Thumbnail.src = thumb?.src ?? 'https://via.placeholder.com/120x60?text=noThumbnail';

                            (<any>document!.getElementById('thumbnail'))!.src = thumb?.src ?? 'https://via.placeholder.com/120x60?text=noThumbnail';
                        }
                        else {
                            (<any>document!.getElementById('thumbnail'))!.src = null;
                            //this.Thumbnail.src = "";
                        }
                    }
                }
            }
            else {
                if (this.Thumbnail != null) {
                    (<any>document!.getElementById('thumbnail'))!.src = null;
                    //this.Thumbnail.src = "";
                }
            }
        }
    }

    public IsOnline(): boolean {
        return this.PrinterState != null &&
            this.PrinterState.State != 'Closed' &&
            this.PrinterState.State != 'Offline' &&
            this.PrinterState.State != "Missing or Invalid API Key";
    }

    public GetTime(value: number | null | undefined): string {
        if (value == null) {
            return "-";
        }

        var h = Math.floor(value! / 3600);
        var m = Math.floor(value! % 3600 / 60);
        var s = Math.floor(value! % 3600 % 60);

        var hDisplay = (h > 0 ? (h < 10 ? "0" : "") + h : "00") + ":";
        var mDisplay = (m > 0 ? (m < 10 ? "0" : "") + m : "00") + ":";
        var sDisplay = s > 0 ? (s < 10 ? "0" : "") + s : "00";
        return hDisplay + mDisplay + sDisplay;
    }

    public Round(value: number | null | undefined): string {
        if (value == null) {
            return "0";
        }

        return Math.round(value).toString();
    }
}

class PrinterState {
	PrinterId?: number;
	State?: string;
	Name?: string;
	ToolActual?: number;
	ToolTarget?: number;
	BedActual?: number;
	BedTarget?: number;
	JobState?: string;
	JobProgress?: number;
	PrintTime?: number;
	PrintTimeLeft?: number;
	EstimatedPrintTime?: number;
	FileName?: string;
	Url?: string;
	LocalInstaceRunning?: boolean;
}
