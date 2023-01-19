using Itamure.Core.Security;

namespace CalendarTools
{
    [Permissions]
    public enum CalendarToolsPermissions
    {
        [PermissionDescription("Calendar Tools Task")]
        ScheduleTaskPermissions,
        [PermissionDescription("Calendar Tools Widget")]
        WidgetPermissions,
    }
}
