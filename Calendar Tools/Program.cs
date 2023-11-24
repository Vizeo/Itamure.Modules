using CalendarTools;
using Itamure.Core;

[assembly: System.Reflection.AssemblyVersion("1.0.*")]

public static class Program
{
    public static void Main(string[] args)
    {
        ModuleLauncher.Start<Module>(args);
    }
}