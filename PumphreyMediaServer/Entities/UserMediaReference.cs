using RizeDb.ObjectOriented;

namespace MediaServer.Entities
{
	public class UserMediaReference : IEntity
	{
		public long Id { get; set; }

		[Index(IndexSearchOptions.Guid)]
		public Guid UserUniqueId { get; set; }

		public long MediaItemId { get; set; }

		[Index(IndexSearchOptions.Guid)]
		public Guid UniqueLink { get; set; }
	}
}
