using Fido2NetLib.Objects;

namespace MediaServer.Entities
{
	public class WebAuthnCredential : IEntity
	{
		public long Id { get; set; }
		public string? UserName { get; set; }
		public string? CredentialJson { get; set; }
		public DateTime TimeStamp { get; set; }
		public DateTime? LastUsedDate { get; set; }
		public List<byte[]>? DevicePublicKeys { get; set; }
		public uint SignCount { get; set; }
	}
}
