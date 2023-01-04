using Itamure.Core.Security;

namespace ScreenControl
{
    [Permissions]
    public enum ScreenControlPermissions
    {
        [PermissionDescription("Screen Control Task")]
        ScheduleTaskPermissions,
    }
}
