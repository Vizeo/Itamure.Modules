import { __decorate } from "tslib";
import { Component, HostListener, ViewChild } from '@angular/core';
// @ts-ignore
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
import { WebGLPreview } from 'gcode-preview';
let PrinterStatusWidgetComponent = class PrinterStatusWidgetComponent {
    constructor() {
        this._downloadedFile = null;
        this.PrinterState = null;
        let params = (new URL(document.location.href)).searchParams;
        let printerId = params.get("printerId");
        alert(printerId);
    }
    onResize(event) {
        this.preview.camera.aspect = window.innerWidth / window.innerHeight;
        this.preview.camera.updateProjectionMatrix();
        this.preview.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    ShowWindow() {
        //this.IframeWindow = (<any>window).showWindow("This is the title", "/test/ViewSettingsWidget", { Center: true, Owner: window });
    }
    ngAfterViewInit() {
        window.addEventListener("OctoprintMonitor.PrinterStatusUpdated", (u) => this.Received(u.detail));
        this.context = this.canvas.nativeElement;
        this.preview = new WebGLPreview({
            canvas: this.context,
            topLayerColor: new THREE.Color('lime').getHex(),
            lastSegmentColor: new THREE.Color('red').getHex(),
            //buildVolume: { x: 180, y: 180, z: 180 },
            initialCameraPosition: [0, 400, 450],
            allowDragNDrop: false,
        });
        this.preview.renderTravel = false;
        this.preview.render();
        this.preview.animate();
    }
    async Received(data) {
        this.PrinterState = data;
        if (this.IsOnline(this.PrinterState) &&
            this._downloadedFile != this.PrinterState.FileName) {
            this._downloadedFile = this.PrinterState.FileName;
            const url = "/OctoprintMonitor/Api/OctoprintMonitorService/GetCurrentGCode?printerId=" + this.PrinterState.PrinterId;
            const response = await fetch(url);
            if (response.status !== 200) {
                console.error('ERROR. Status Code: ' + response.status);
                return;
            }
            this.preview.clear();
            await this.preview._readFromStream(response.body);
            //this.preview.scene.background = new THREE.Color(0xffffff);
            this.preview.render();
            const controls = new OrbitControls(this.preview.camera, this.preview.renderer.domElement);
            controls.autoRotate = true;
            this.preview.animate = () => {
                requestAnimationFrame(this.preview.animate);
                controls.update();
                this.preview.renderer.render(this.preview.scene, this.preview.camera);
            };
        }
        else {
            this.preview.clear();
        }
    }
    IsOnline(printerState) {
        return printerState.State != 'Closed' &&
            printerState.State != 'Offline' &&
            printerState.State != "Missing or Invalid API Key";
    }
    GetTime(value) {
        if (value == null) {
            return "-";
        }
        var h = Math.floor(value / 3600);
        var m = Math.floor(value % 3600 / 60);
        var s = Math.floor(value % 3600 % 60);
        var hDisplay = (h > 0 ? (h < 10 ? "0" : "") + h : "00") + ":";
        var mDisplay = (m > 0 ? (m < 10 ? "0" : "") + m : "00") + ":";
        var sDisplay = s > 0 ? (s < 10 ? "0" : "") + s : "00";
        return hDisplay + mDisplay + sDisplay;
    }
    Round(value) {
        if (value == null) {
            return "0";
        }
        return Math.round(value).toString();
    }
};
__decorate([
    ViewChild('myCanvas', { static: false })
], PrinterStatusWidgetComponent.prototype, "canvas", void 0);
__decorate([
    HostListener('window:resize', ['$event'])
], PrinterStatusWidgetComponent.prototype, "onResize", null);
PrinterStatusWidgetComponent = __decorate([
    Component({
        selector: 'printerStatusWidget',
        templateUrl: './printerStatusWidget.component.html',
        styleUrls: ['./printerStatusWidget.component.less']
    })
], PrinterStatusWidgetComponent);
export { PrinterStatusWidgetComponent };
class PrinterState {
}
//# sourceMappingURL=printerStatusWidget.component.js.map