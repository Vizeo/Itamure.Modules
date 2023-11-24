import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from "@angular/core";

@Component(
    {
        selector: 'imageUpload',
        templateUrl: './imageUpload.component.html',
        styleUrls: ['./imageUpload.component.less']
    })
export class ImageUploadComponent {
    constructor() {
    }

    private _source: string | undefined | null;

    public FileDropOver = false;
    public SourceSet = false;

    @ViewChild("image")
    private _image: ElementRef<HTMLImageElement> | undefined; 

    @Output('imageDropped')
    ImagedDropped: EventEmitter<DownloadFile> = new EventEmitter<DownloadFile>();

    @Input("src")
    public get Source(): string | undefined | null {
        return this._source;
    }
    public set Source(value: string | undefined | null) {
        this._source = value;
        this.SourceSet = value != null &&
            value.length > 0;

        if (this.SourceSet &&
            this._image != null) {
            this._image.nativeElement.src = <any>this._source;
        }
    }

    public FindFile() {
        //this._fileFinder.click();
    }

    public ImageError() {
        if (this._image != null) {
            this.Source = null;
        }
    }

    public ngAfterViewInit() {
        if (this.SourceSet) {
            this._image!.nativeElement.src = this._source!;
        }
    }

    public DraggingOver(event: DragEvent) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer!.dropEffect = "copy";
    }

    public Drop(event: DragEvent) {
        event.stopPropagation();
        event.preventDefault();
        let fileList = event.dataTransfer!.files;

        if (fileList != null &&
            fileList.length > 0) {
            var file = fileList[0];
            if (file.type.toLowerCase().indexOf("image/") == 0) {
                this.DownloadFile(file);
            }
            else {
                alert("Unsupported file Type");
            }
        }
    }

    private DownloadFile(file: File) {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            let downloadedFile = new DownloadFile();
            downloadedFile.Name = file.name;
            downloadedFile.Type = file.type;
            downloadedFile.Data = <ArrayBuffer>fileReader.result;
            this.SourceSet = true;
            this._image!.nativeElement.src = <any>fileReader.result;
            this.ImagedDropped.emit(downloadedFile);
        };
        fileReader.readAsDataURL(file);
    }

    public ShowDownloadFile(downloadFile: DownloadFile) {
        this._image!.nativeElement.src = <any>downloadFile.Data;
        this.SourceSet = true;
   }
}

export class DownloadFile {
    public Name: string | undefined;
    public Type: string | undefined;
    public Data: ArrayBuffer | null = null;
}
