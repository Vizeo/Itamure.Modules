using OctoprintMonitor.Entities;
using RizeDb;

namespace OctoprintMonitor
{
    //Remove the magic string issue
    internal static class StoreageExtensions
    {
        public static IList<T> Retrieve<T>(this ObjectStore objectStore)
            where T : class, IEntity, new()
        {
            return objectStore.Retreive<T>(typeof(T).Name);
        }

        public static void Store<T>(this ObjectStore objectStore, T item)
            where T : class, IEntity, new()
        {
            objectStore.Store<T>(typeof(T).Name, item);
        }

        public static void Remove<T>(this ObjectStore objectStore, T item)
            where T : class, IEntity, new()
        {
            objectStore.Remove(typeof(T).Name, item.Id);
        }
    }
}
