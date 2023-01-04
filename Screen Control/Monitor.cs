using System.Runtime.InteropServices;

namespace ScreenControl
{
    internal class Monitor
    {
        private static int SC_MONITORPOWER = 0xF170;

        private static uint WM_SYSCOMMAND = 0x0112;

        [DllImport("user32.dll")]
        static extern IntPtr SendMessage(int hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        public enum MonitorState
        {
            ON = -1,
            OFF = 2,
            STANDBY = 1
        }

        public static void SetMonitorState(MonitorState state)
        {
            SendMessage(-1, WM_SYSCOMMAND, (IntPtr)SC_MONITORPOWER, (IntPtr)state);
        }
    }
}
