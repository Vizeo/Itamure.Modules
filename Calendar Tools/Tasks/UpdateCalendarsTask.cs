using CalendarTools.Events;
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
            var users = Module.CurrentModule?.AvaliableUsers;
            var calendars = Module.ObjectStore?.Retrieve<Entities.Calendar>();
            if (calendars != null)
            {
                var title = "Updating Calendars";
                try
                {
                    var count = 0;
                    foreach (var calendar in calendars)
                    {
                        var userName = "All";
                        if (calendar.UserId.HasValue)
                        {
                            var user = users?.FirstOrDefault(u => u.Id == calendar.UserId);
                            if (user == null)
                            {
                                continue;
                            }
                            else
                            {
                                userName = user.Name;
                            }
                        }

                        try
                        {
                            scheduledTaskInterface.SendProgress(title, calendars.Count(), count);
                            if (calendar.ICalAddress != null)
                            {
                                calendar.Data = CalendarManager.GetCalendarData(calendar.ICalAddress).Result;
                                Module.ObjectStore?.Store(calendar);
                                scheduledTaskInterface.WriteAndRecord($"Calendar {calendar.Name} for {userName} updated");
                            }
                        }
                        catch (Exception ex)
                        {
                            scheduledTaskInterface.WriteAndRecord($"Calendar {calendar.Name} for {userName} update failed");
                            scheduledTaskInterface.LogException(new Exception($"Unable to update calendar {calendar.Name} for user {userName}", ex), SystemLogType.Warning, GetType().Assembly.FullName);
                        }

                        count++;
                    }
                }
                finally
                {
                    scheduledTaskInterface.EndProgress(title);
                    Module.CurrentModule?.SendEvent(new CalendarsUpdated());
                }
            }
        }
    }
}
