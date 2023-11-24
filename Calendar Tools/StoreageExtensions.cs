using CalendarTools.Entities;
using RizeDb;
using System.Linq.Expressions;

namespace CalendarTools
{
    //Remove the magic string issue
    internal static class StoreageExtensions
    {
        public static IList<T> Retrieve<T>(this ObjectStore objectStore)
            where T : class, IEntity, new()
        {
            return objectStore.Retrieve<T>(typeof(T).Name);
        }

        public static IList<T> Retrieve<T>(this ObjectStore objectStore, Expression<Func<T, bool>> predicate) 
            where T : class, IEntity, new()
        {
            return objectStore.Retrieve<T>(typeof(T).Name, predicate);
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
    }
}
