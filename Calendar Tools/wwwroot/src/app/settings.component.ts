import { Component } from '@angular/core';
import { Calendar, CalendarToolsService, UserData } from './Services/calendarTools.service';

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.less']
})
export class SettingsComponent {
  constructor(private calendarToolsService: CalendarToolsService) {
    this.GetData();
  }

  public Users?: UserData[];
  public Calendars?: CalendarEx[];

  public SelectedUserId?: string | null = null;
  public Name?: string | null = null;
  public ICalAddress?: string | null = null;
  public Color: string = "#7ca276";
  public Validating: boolean = false;

  public async GetData() {
    let usersWait = this.calendarToolsService.GetUsers();
    let calendarsWait = this.calendarToolsService.GetCalendars();

    this.Users = await usersWait;
    this.Calendars = await calendarsWait;
  }

  public async AddCalendar() {
    if (this.CanAdd()) {
      let calendar = new Calendar();
      calendar.Name = this.Name;
      calendar.Color = this.Color;
      calendar.ICalAddress = this.ICalAddress;
      calendar.UserId = <string | undefined>this.SelectedUserId;
      if (await this.ValidateICalendar(calendar)) {
        var finalCalendar = await this.calendarToolsService.AddCalendar(calendar);
        this.Name = null;
        this.Color = "#7ca276";
        this.ICalAddress = null;
        this.SelectedUserId = null;

        this.Calendars?.unshift(finalCalendar);
      }
    }
  }

  public async UpdateCalendar(calendar: Calendar) {
    if (this.CanUpate(calendar)) {
      await this.calendarToolsService.UpdateCalendar(calendar);
    }    
  }

  public async UpdateICal(calendar: Calendar) {
    if (await this.ValidateICalendar(calendar)) {
      await this.UpdateCalendar(calendar);
    }
  }

  public GetUserName(calendar: Calendar) {
    if (calendar.UserId == null) {
      return "All";
    }

    if (this.Users != null) {
      let index = this.Users.findIndex(u => u.Id == calendar.UserId);
      if (index != -1) {
        return this.Users[index].Name;
      }
    }
    return "Unknown";
  }

  public async DeleteCalendar(calendar: Calendar) {
    if (confirm("Remove calendar " + calendar.Name + " ?")) {
      await this.calendarToolsService.DeleteCalendar(calendar);
      let index = this.Calendars?.indexOf(calendar);
      this.Calendars?.splice(<number>index, 1);
    }
  }

  public CanUpate(calendar: Calendar) {
    return calendar.Name != null &&
      calendar.Name.length > 0 &&
      calendar.ICalAddress != null &&
      calendar.ICalAddress.length > 10;
  }

  private async ValidateICalendar(calendar: Calendar): Promise<boolean> {
    this.Validating = true;
    var result = await this.calendarToolsService.ValidateCalendar(calendar);
    this.Validating = false;
    if (!result) {
      alert("Could not validate ICal Calendar Address");
    }
    return result;
  }

  public CanAdd(): boolean {
    return this.Name != null &&
      this.Name.length > 0 &&
      this.ICalAddress != null &&
      this.ICalAddress.length > 10;
  }  
}

class CalendarEx extends Calendar {
  Error?: boolean;
}
