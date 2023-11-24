import { Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CalendarToolsService, CalendarItemData } from './Services/calendarTools.service';

@Component({
    selector: 'todayWidget',
    templateUrl: './todayWidget.component.html',
    styleUrls: ['./todayWidget.component.less']
})
export class TodayWidgetComponent {
  constructor(private calendarToolsService: CalendarToolsService) {
    this.GetCalendars();

    setInterval(() => {
      if (this._startDate != null &&
        (new Date).getDate() != this._startDate.getDate()) {
        this.GetCalendars();
      }

      this.ScrollToTop();
    }, 60000);
  }

  @ViewChild("list")
  List!: ElementRef;

  private _startDate?: Date;

  public Days?: Day[];

  private ScrollToTop() {
    //TODO: Only do this if not scrolled recently
    if (this.List != null) {
      this.List.nativeElement.scrollTo(0, 0);
    }
  }
  
  private async GetCalendars() {
    let totalDays = 14; //14 Days
    let curTime = new Date();

    let start = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
    this._startDate = start;
    let end = new Date(start);
    end.setDate(end.getDate() + totalDays); 

    let events = await this.calendarToolsService.GetCalendarItems(start, end);
    this.Days = new Array<Day>();

    for (let j = 0; j < totalDays; j++) {
      let day = new Day();
      this.Days.push(day);
      day.Date = new Date(start);
      day.Date.setDate(day.Date.getDate() + j);
      day.AllDay = new Array<CalendarItemData>();
      day.Events = new Array<CalendarItemData>();

      let end = new Date(day.Date);
      end.setDate(end.getDate() + 1);

      for (let i = 0; i < events.length; i++) {
        let event = events[i];

        if ((event.StartDate! >= day.Date && event.EndDate! <= end) ||
          (event.StartDate! <= day.Date && event.EndDate! > day.Date)) {

          if (event.IsAllDay) {
            day.AllDay.push(event);
          }
          else {
            day.Events.push(event);
          }
        }
      }
    }

    this.ScrollToTop();
  }

  public ngAfterViewInit() {
    window.addEventListener("CalendarTools.CalendarsUpdated", (u) => this.GetCalendars());    
  }
}

class Day {
  public Date?: Date;
  public AllDay?: CalendarItemData[];
  public Events?: CalendarItemData[];
}
