import { Component, Input } from "@angular/core";


@Component(
<<<<<<< HEAD
    {
        selector: 'icon',
        templateUrl: './icon.component.html',
        styleUrls: ['./icon.component.less']
    })
export class IconComponent {
    constructor() {
    }
=======
{
        selector: 'icon',
        templateUrl: './icon.component.html',
        styleUrls: ['./icon.component.less']
})
export class IconComponent {   
    constructor() {
    }   
>>>>>>> 59206c8022c61c0e01b2fb31a5db4a2f17b4e705

    @Input("name")
    public Name: string | null = null;
}