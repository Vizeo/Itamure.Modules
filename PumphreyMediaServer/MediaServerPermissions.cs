using Itamure.Core.Security;

namespace MediaServer
{
    [Permissions]
    public enum MediaServerPermissions
    {
        [PermissionDescription("Pumphrey Media Server App")]
        AppPermissions,
        [PermissionDescription("Pumphrey Media Server Settings")]
        SettingsPermissions,
        [PermissionDescription("Modify Sources")]
        ModifySourcesPermissions,
        [PermissionDescription("Modify Media File Types")]
        ModifyMediaFileTypesPermissions,
        [PermissionDescription("Modify Raings")]
        ModifyRatingsPermissions
    }
}
