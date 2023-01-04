using Itamure.Core;

namespace ScreenControl.Tasks
{
    public class ScreenOffTask : IScheduledTask
    {
        public string Name => "Screen Off Task";

        public object CanRunManuallyPermission => ScreenControlPermissions.ScheduleTaskPermissions;

        public object CanChangeEnabledPermission => ScreenControlPermissions.ScheduleTaskPermissions;

        public object CanModifyPermission => ScreenControlPermissions.ScheduleTaskPermissions;

        public string? AdministrationWebPath => null;

        public void Run(IScheduledTaskInterface scheduledTaskInterface)
        {
            ScreenControl.Monitor.SetMonitorState(Monitor.MonitorState.OFF);
        }
    }
}
