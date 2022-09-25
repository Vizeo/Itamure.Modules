import { __decorate } from "tslib";
import { Component, Input } from "@angular/core";
let IconComponent = class IconComponent {
    constructor() {
        this.Name = null;
    }
};
__decorate([
    Input("name")
], IconComponent.prototype, "Name", void 0);
IconComponent = __decorate([
    Component({
        selector: 'icon',
        templateUrl: './icon.component.html',
        styleUrls: ['./icon.component.less']
    })
], IconComponent);
export { IconComponent };
//# sourceMappingURL=icon.component.js.map