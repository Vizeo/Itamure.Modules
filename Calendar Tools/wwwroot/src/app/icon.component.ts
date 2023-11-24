import { Component, Input } from "@angular/core";


@Component(
  {
    selector: 'icon',
    templateUrl: './icon.component.html',
    styleUrls: ['./icon.component.less']
  })
export class IconComponent {
  constructor() {
  }

  @Input("name")
  public Name: string | null = null;
}
