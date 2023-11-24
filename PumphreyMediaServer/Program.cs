using Itamure.Core;
using MediaServer;

[assembly: System.Reflection.AssemblyVersion("1.0.*")]

public static class Program
{
    public static void Main(string[] args)
    {
        ModuleLauncher.Start<Module>(args);
    }
}