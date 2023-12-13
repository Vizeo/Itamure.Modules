using Itamure.Core;
using MediaServer.Entities;

namespace MediaServer.Events
{
    public class ReceiverEvent : Event
    {
        public ReceiverEvent()
        {
        }

        public string? ReceiverId { get; set; }
		public string? UserName { get; set; }
		public string? MediaName { get; set; }
		public double Length { get; set; }
        public double Position { get; set; }
        public string? Status { get; set; }
    }
}
