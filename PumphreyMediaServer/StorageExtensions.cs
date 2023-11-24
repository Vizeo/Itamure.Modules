using MediaServer.Entities;
using RizeDb;
using RizeDb.ObjectOriented;

namespace MediaServer
{
    internal static class StorageExtensions
    {
        public static IQueryBuilder<T> Retrieve<T>(this ObjectStore objectStore)
            where T : class, IEntity
        {
            return objectStore.Retrieve<T>(typeof(T).Name);
        }

        public static IQueryBuilder<TConcrete> Retrieve<T, TConcrete>(this ObjectStore objectStore)
            where T : class, IEntity
            where TConcrete : class, T
        {
            return objectStore.Retrieve<TConcrete>(typeof(T).Name);
        }

        public static T Retrieve<T>(this ObjectStore objectStore, long id)
            where T : class, IEntity
        {
            return objectStore.Retrieve<T>(typeof(T).Name, id);
        }

        public static void Store<T>(this ObjectStore objectStore, T item)
            where T : class, IEntity
        {
            objectStore.Store<T>(typeof(T).Name, item);
        }

        public static void Remove<T>(this ObjectStore objectStore, T item)
            where T : class, IEntity
        {
            objectStore.Remove(typeof(T).Name, item.Id);
        }

        public static void Remove<T>(this ObjectStore objectStore, long id)
            where T : class, IEntity
        {
            objectStore.Remove(typeof(T).Name, id);
        }

        public static void Update<T, TConcrete>(this ObjectStore objectStore, long id, object values)
            where T : class, IEntity
            where TConcrete : class, T
        {
            objectStore.Update<TConcrete>(typeof(T).Name, id, values);
        }

        public static void Update<T>(this ObjectStore objectStore, long id, object values)
            where T : class, IEntity
        {
            objectStore.Update<T>(typeof(T).Name, id, values);
        }

        //Transaction Group
        public static void Store<T>(this TransactionGroup transactionGroup, T item)
            where T : class, IEntity
        {
            transactionGroup.Store<T>(typeof(T).Name, item);
        }

        public static void Remove<T>(this TransactionGroup transactionGroup, T item)
            where T : class, IEntity
        {
            transactionGroup.Remove(typeof(T).Name, item.Id);
        }

        public static void Remove<T>(this TransactionGroup transactionGroup, long id)
            where T : class, IEntity
        {
            transactionGroup.Remove(typeof(T).Name, id);
        }

        public static void Update<T, TConcrete>(this TransactionGroup transactionGroup, long id, object values)
            where T : class, IEntity
            where TConcrete : class, T
        {
            transactionGroup.Update<TConcrete>(typeof(T).Name, id, values);
        }

        public static void Update<T>(this TransactionGroup transactionGroup, long id, object values)
            where T : class, IEntity
        {
            transactionGroup.Update<T>(typeof(T).Name, id, values);
        }
    }
}
