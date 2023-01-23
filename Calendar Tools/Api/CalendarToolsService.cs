using CalendarTools.Entities;
using IntegratedWebServer.Core.RequestProcessors;
using Itamure.Core;
using Itamure.Core.Web;
using Itamure.Core.Web.Security;
using System.Net;
using System.Net.Http.Headers;
using System.Reflection;

namespace CalendarTools.Api
{
    [RequestProcessorMap($"/{Module.WEB_ROUTE_BASE}/Api/CalendarToolsService")]
    public class CalendarToolsService : RestServiceBase
    {
        [Api]
        [Authorize(ModulePermissions.ModifySettings)]
        public IEnumerable<UserData>? GetUsers()
        {
            return Module.CurrentModule?.AvaliableUsers
                .Select(u => new UserData()
                {
                    Name = u.Name,
                    Id = u.Id
                });
        }

        [Api]
        [Authorize(ModulePermissions.ModifySettings)]
        public IEnumerable<Calendar>? GetCalendars()
        {
            return Module.ObjectStore?.Retrieve<Calendar>();
        }

        [Api]
        [Authorize(ModulePermissions.ModifySettings)]
        public async Task<Calendar> AddCalendar(Calendar calendar)
        {
            calendar.Id = 0;
            if (calendar.ICalAddress != null)
            {
                calendar.Data = await CalendarManager.GetCalendarData(calendar.ICalAddress);
                if (!string.IsNullOrWhiteSpace(calendar.Data))
                {
                    Module.ObjectStore?.Store(calendar);
                }
            }
            return calendar; //Return so the UI has the ID and any other updates
        }

        [Api]
        [Authorize(ModulePermissions.ModifySettings)]
        public async Task UpdateCalendar(Calendar calendar)
        {
            if (calendar.ICalAddress != null)
            {
                calendar.Data = await CalendarManager.GetCalendarData(calendar.ICalAddress);
                if (!string.IsNullOrWhiteSpace(calendar.Data))
                {
                    Module.ObjectStore?.Store(calendar);
                }
            }
        }

        [Api]
        [Authorize(ModulePermissions.ModifySettings)]
        public void DeleteCalendar(Calendar calendar)
        {
            Module.ObjectStore?.Remove(calendar);
        }

        [Api]
        [Authorize(ModulePermissions.ModifySettings)]
        public async Task<bool> ValidateCalendar(Calendar calendar)
        {
            try
            {
                if (calendar.ICalAddress != null)
                {
                    var loadedCalendar = Ical.Net.Calendar.Load(await CalendarManager.GetCalendarData(calendar.ICalAddress));
                    return true;
                }
            }
            catch
            {
            }
            return false;
        }

        [Api]
        [Authorize(CalendarToolsPermissions.WidgetPermissions)]
        public IEnumerable<CalendarItemData> GetCalendarItems(DateTimeOffset start, DateTimeOffset end)
        {
            var result = new List<CalendarItemData>();

            var userId = UserId;

            var calendars = Module.ObjectStore?.Retrieve<Entities.Calendar>(c => !c.UserId.HasValue ||
                c.UserId == UserId);

            if (calendars != null)
            {
                foreach (var calendar in calendars)
                {
                    try
                    {
                        if (calendar.Data != null &&
                            !string.IsNullOrWhiteSpace(calendar.Data))
                        {
                            var loadedCalendar = Ical.Net.Calendar.Load(calendar.Data);

                            var events = loadedCalendar.GetOccurrences(start.ToUniversalTime().DateTime, end.ToUniversalTime().DateTime);

                            foreach (var calItem in events)
                            {
                                if (calItem.Source is Ical.Net.CalendarComponents.CalendarEvent)
                                {
                                    var calEvent = (Ical.Net.CalendarComponents.CalendarEvent)calItem.Source;
                                    result.Add(new CalendarItemData()
                                    {
                                        Summary = calEvent.Summary,
                                        Uid = calEvent.Uid,
                                        DurationMinutes = Convert.ToInt32(calEvent.Duration.TotalMinutes),
                                        IsAllDay = calEvent.IsAllDay,
                                        StartDate = calItem.Period.StartTime.AsDateTimeOffset,
                                        EndDate = calItem.Period.EndTime.AsDateTimeOffset,
                                        Calendar = calendar.Name,
                                        Color = calendar.Color
                                    });
                                }
                            }
                        }
                    }
                    catch { }
                }
            }

            return result
                .OrderBy(c => c.StartDate);
        }
    }
}
