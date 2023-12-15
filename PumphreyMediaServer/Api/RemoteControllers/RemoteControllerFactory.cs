namespace MediaServer.Api.RemoteControllers
{
	internal static class RemoteControllerFactory
	{
		public static IRemoteController GetRemoteController(string controlerType)
		{
			switch(controlerType) 
			{
				case "Upnp":
					return new UpnpController();
			}

			throw new Exception("Undefined Controller");
		}
	}
}
