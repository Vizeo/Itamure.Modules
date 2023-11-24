using CalendarTools.Entities;
using RizeDb;
using RizeDb.ObjectOriented;
using System.Linq.Expressions;

namespace CalendarTools
{
    //Remove the magic string issue
    internal static class StorageExtensions
    {
        public static IQueryBuilder<T> Retrieve<T>(this ObjectStore objectStore)
            where T : class, IEntity, new()
        {
            return objectStore.Retrieve<T>(typeof(T).Name);
        }

        public static T Retrieve<T>(this ObjectStore objectStore, long id)
            where T : class, IEntity, new()
        {
            return objectStore.Retrieve<T>(typeof(T).Name, id);
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

        public static void Update<T>(this ObjectStore objectStore, long id, object values)
            where T : class, IEntity, new()
        {
            objectStore.Update<T>(typeof(T).Name, id, values);
        }
    }
}
