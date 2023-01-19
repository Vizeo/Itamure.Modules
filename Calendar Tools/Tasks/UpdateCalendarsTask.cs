using Ical.Net;
using Itamure.Core;

namespace CalendarTools.Tasks
{
    public class CalendarToolsTask : IScheduledTask
    {
        public string Name => "Update Calendars Task";

        public object CanRunManuallyPermission => CalendarToolsPermissions.ScheduleTaskPermissions;

        public object CanChangeEnabledPermission => CalendarToolsPermissions.ScheduleTaskPermissions;

        public object CanModifyPermission => CalendarToolsPermissions.ScheduleTaskPermissions;

        public string? AdministrationWebPath => null;

        public void Run(IScheduledTaskInterface scheduledTaskInterface)
        {
            HttpClient httpClient = new HttpClient();
            var result = httpClient.GetStringAsync("https://calendar.google.com/calendar/ical/chrisjwoods%40gmail.com/private-f2b69ea77805a10046174445731f63ce/basic.ics").Result;
            var calendar = Calendar.Load(result);
        }
    }
}
