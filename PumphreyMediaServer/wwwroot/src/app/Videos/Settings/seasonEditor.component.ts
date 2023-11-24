import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Season } from '../../Services/mediaServer.service';
import { GroupValidatorBaseDirective } from 'interLink';

@Component({
    selector: 'seasonEditor',
    templateUrl: './seasonEditor.component.html',
    styleUrls: ['./seasonEditor.component.less']
})
export class SeasonEditorComponent {
    constructor() {
    }

    @Input("season")
    public Season: Season | null = null;

    @Output("saved")
    public Saved = new EventEmitter();

    @Output("canceled")
    public Canceled = new EventEmitter();

    @ViewChild("seasonDialog")
    private _seasonDialog!: ElementRef<HTMLDialogElement>;

    public Show() {
        this._seasonDialog.nativeElement.showModal();
    }

    public CanSave(): boolean {
        return GroupValidatorBaseDirective.IsValid("seasonValidation");
    }

    public Cancel() {
        this.Canceled.emit();
        this._seasonDialog.nativeElement.close();
    }

    public Save() {
        this.Saved.emit();
        this._seasonDialog.nativeElement.close();
    }
}
