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
	}
}
