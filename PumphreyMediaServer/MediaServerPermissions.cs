using Itamure.Core.Security;

namespace MediaServer
{
    [Permissions]
    public enum MediaServerPermissions
    {
        [PermissionDescription("Media Server App")]
        AppPermissions,
        [PermissionDescription("Media Server Settings")]
        SettingsPermissions,
        [PermissionDescription("Modify Sources")]
        ModifySourcesPermissions,
        [PermissionDescription("Modify Media File Types")]
        ModifyMediaFileTypesPermissions,
        [PermissionDescription("Modify Raings")]
        ModifyRatingsPermissions
    }
}
