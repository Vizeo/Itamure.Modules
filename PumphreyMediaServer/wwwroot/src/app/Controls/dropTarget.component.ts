import { Component, EventEmitter, HostBinding, Input, Output } from "@angular/core";


@Component(
    {
        selector: 'dropTarget',
        templateUrl: './dropTarget.component.html',
        styleUrls: ['./dropTarget.component.less']
    })
export class DropTargetComponent {
    constructor() {
    }

    @HostBinding('class.draggingOver')
    public DraggingOver: boolean = false;

    public Drop(event: DragEvent) {
        this.DraggingOver = false;
        this.OnDropped.emit();
        event.preventDefault()
    }

    public DragOver(event: DragEvent) {
        this.DraggingOver = true;
        event.preventDefault();
    }

    public DragEnter(event: DragEvent) {
        this.DraggingOver = true;
        event.preventDefault();
    }

    public DragLeave(event: DragEvent) {
        this.DraggingOver = false;
        event.preventDefault();
    }

    @Output("dropped")
    public OnDropped = new EventEmitter();
}