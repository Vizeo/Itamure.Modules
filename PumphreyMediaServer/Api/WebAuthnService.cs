using Fido2NetLib;
using Fido2NetLib.Objects;
using IntegratedWebServer.Core.RequestProcessors;
using Itamure.Core;
using Itamure.Core.Web;
using Itamure.Core.Web.Security;
using MediaServer.Entities;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading;

namespace MediaServer.Api
{
	[RequestProcessorMap($"/{Module.WEB_ROUTE_BASE}/Api/webAuthnService")]
	public class WebAuthnService : RestServiceBase
	{
		private const string ATTESTATION_OPTIONS = "fido2.attestationOptions";
		private const string ASSERTION_OPTIONS = "fido2.assertionOptions";
		private const string CREDENTIAL_ENTITIES = "credentialEntities";
		private const string CREDENTIALS = "credentials";
		private static Random random = new();
		private static Cache<string, AuthenticationValues> _cache = new();

		public WebAuthnService()
		{
		}

		[Api]
		[Authorize]
		public string GetCode()
		{
			var token = Module.CurrentModule!.CreateAccessToken(Session.UniqueId);

			var verificationCode = RandomString(8);
			var authenticationValues = new AuthenticationValues()
			{
				UserId = UserId!.Value,
				UserName = "Poodoo head", //Needs to come from access token
				AuthenticationToken = token
			};

			_cache.StoreValue(verificationCode, authenticationValues, TimeSpan.FromMinutes(10));
			return verificationCode;
		}

		[Api]
		public string GetChallenge(string verificationCode)
		{
			var authenticationValues = _cache.GetValue(verificationCode);
			if (authenticationValues != default)
			{
				//Code goes in here
			}

			//Temporary
			authenticationValues = new AuthenticationValues()
			{
				UserId = Guid.NewGuid(),
				UserName = "Poodoo head",
				AuthenticationToken = "Just a lot of stuff"
			};
			_cache.StoreValue(verificationCode, authenticationValues, TimeSpan.FromMinutes(10));
			//EndTemporary

			authenticationValues.Challenge = RandomString(32);
			return authenticationValues.Challenge;
		}

		[Api]
		public string? GetCredentialOptions(string challange)
		{
			var authenticationValues = _cache.GetValues()
				.First(v => v.Challenge == challange);

			if (authenticationValues != null)
			{
				var user = new Fido2User
				{
					DisplayName = authenticationValues.UserName,
					Name = authenticationValues.UserName,
					Id = authenticationValues.UserId.ToByteArray()
				};

				var authenticatorSelection = new AuthenticatorSelection
				{
					ResidentKey = ResidentKeyRequirement.Required,
					UserVerification = UserVerificationRequirement.Required,
					AuthenticatorAttachment = AuthenticatorAttachment.Platform
				};
				var exts = new AuthenticationExtensionsClientInputs()
				{
					Extensions = true,
					UserVerificationMethod = true,
					DevicePubKey = new AuthenticationExtensionsDevicePublicKeyInputs()
					{
						Attestation = "platform"
					},
					CredProps = true
				};

				var options = GetFido2().RequestNewCredential(user, new PublicKeyCredentialDescriptor[0], authenticatorSelection, AttestationConveyancePreference.None, exts);

				// 4. Temporarily store options, session/in-memory cache/redis/db
				var json = options.ToJson();
				Session[ATTESTATION_OPTIONS] = json;
				return json;
			}

			return null;
		}

		[Api]
		public async Task<string> MakeCredential(string json)
		{
			var attestationResponse = System.Text.Json.JsonSerializer.Deserialize<AuthenticatorAttestationRawResponse>(json);

			try
			{
				// 1. get the options we sent the client
				var jsonOptions = (string)Session[ATTESTATION_OPTIONS];
				var options = CredentialCreateOptions.FromJson(jsonOptions);

				// 2. Create callback so that lib can verify credential id is unique to this user
				IsCredentialIdUniqueToUserAsyncDelegate callback = static (args, cancellationToken) =>
				{
					//var users = await DemoStorage.GetUsersByCredentialIdAsync(args.CredentialId, cancellationToken);
					//if (users.Count > 0)
					//	return false;

					return Task.FromResult(true);
				};

				// 2. Verify and make the credentials
				var makeNewCredential = await GetFido2().MakeNewCredentialAsync(attestationResponse!, options, callback);
				var credential = makeNewCredential.Result!;

				var credentialJson = System.Text.Json.JsonSerializer.Serialize(credential);
				var webAuthnCredential = new WebAuthnCredential()
				{
					UserName = credential.User.Name,
					CredentialJson = credentialJson,
					TimeStamp = DateTime.UtcNow,
					DevicePublicKeys = new List<byte[]>() {	credential.DevicePublicKey }
				};

				Module.ObjectStore!.Store(webAuthnCredential);
			}
			catch (Exception e)
			{
				//return Json(new { status = "error", errorMessage = FormatException(e) });
				throw e;
			}

			return "Success"; //TODO: Use a confirmation object
		}

		[Api]
		public string GetAssertionOptions(string username)
		{
			try
			{
				var existingCredentials = new List<RegisteredPublicKeyCredential>();
				var existingCredentialDescriptors = new List<PublicKeyCredentialDescriptor>();
				var credentialDictionary = new Dictionary<RegisteredPublicKeyCredential, WebAuthnCredential>();

				if (!string.IsNullOrEmpty(username))
				{
					// 1. Get registered credentials from database
					var webAuthnCredentials = Module.ObjectStore!.Retrieve<WebAuthnCredential>()
						.Where(c => c.UserName == username)
						.ToList();

					foreach (var webAuthnCredential in webAuthnCredentials)
					{
						var credential = System.Text.Json.JsonSerializer.Deserialize<RegisteredPublicKeyCredential>(webAuthnCredential.CredentialJson!)!;
						existingCredentials.Add(credential);

						var publicKeyCredentialDescriptor = new PublicKeyCredentialDescriptor(PublicKeyCredentialType.PublicKey, credential.Id, credential.Transports);
						existingCredentialDescriptors.Add(publicKeyCredentialDescriptor);

						credentialDictionary.Add(credential, webAuthnCredential);
					}
				}

				var exts = new AuthenticationExtensionsClientInputs()
				{
					Extensions = true,
					UserVerificationMethod = true,
					DevicePubKey = new AuthenticationExtensionsDevicePublicKeyInputs()
				};

				// 2. Create options
				var uv = UserVerificationRequirement.Required;
				var options = GetFido2().GetAssertionOptions(existingCredentialDescriptors, uv, exts);

				// 3. Temporarily store options, session/in-memory cache/redis/db
				Session[ASSERTION_OPTIONS] = options;
				Session[CREDENTIAL_ENTITIES] = credentialDictionary;
				Session[CREDENTIALS] = existingCredentials;

				// 4. Return options to client
				return System.Text.Json.JsonSerializer.Serialize(options);
			}
			catch (Exception e)
			{
				throw e;
			}
		}

		[Api]
		public async Task<string?> MakeAssertion(string json)
		{
			var clientResponse = System.Text.Json.JsonSerializer.Deserialize<AuthenticatorAssertionRawResponse>(json)!;

			try
			{
				// 1. Get the assertion options we sent the client
				var options = (AssertionOptions)Session[ASSERTION_OPTIONS];

				// 2. Get registered credential from database
				var cred = ((List<RegisteredPublicKeyCredential>)Session[CREDENTIALS])
					.First(c => c.Id.SequenceEqual(clientResponse.Id));

				var webAuthnCredential = ((Dictionary<RegisteredPublicKeyCredential, WebAuthnCredential>)Session[CREDENTIAL_ENTITIES])[cred];

				// 3. Get credential counter from database
				//var storedCounter = creds.SignCount;

				// 4. Create callback to check if the user handle owns the credentialId
				IsUserHandleOwnerOfCredentialIdAsync callback = static (args, cancellationToken) =>
				{
					//var storedCreds = await DemoStorage.GetCredentialsByUserHandleAsync(args.UserHandle, cancellationToken);
					//return storedCreds.Exists(c => c.Descriptor.Id.SequenceEqual(args.CredentialId));
					return Task.FromResult(true);
				};

				// 5. Make the assertion
				var res = await GetFido2().MakeAssertionAsync(clientResponse, options, cred.PublicKey, webAuthnCredential.DevicePublicKeys!, webAuthnCredential.SignCount, callback);

				if (res.DevicePublicKey is not null)
				{
					webAuthnCredential.DevicePublicKeys!.Add(res.DevicePublicKey);
				}

				// 6. Store the updated counter
				//DemoStorage.UpdateCounter(res.CredentialId, res.SignCount);
				Module.ObjectStore!.Store(webAuthnCredential);

				// 7. return OK to client
				return System.Text.Json.JsonSerializer.Serialize(res);
			}
			catch (Exception e)
			{
				//return Json(new { Status = "error", ErrorMessage = FormatException(e) });
			}
			return null;
		}

		private IFido2 GetFido2()
		{
			var host = Request.HeaderValues["Host"];
			var schema = Request.IsSecure ? "HTTPS" : "HTTP";

			var configuration = new Fido2Configuration()
			{
				ServerDomain = host,
				ServerName = host,
				Origins = new HashSet<string> { $"{schema}://{host}" },
			};

			return new Fido2(configuration); //Static?
		}

		private static string RandomString(int length)
		{
			const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
			return new string(Enumerable.Repeat(chars, length)
				.Select(s => s[random.Next(s.Length)]).ToArray());
		}
	}

	public class AuthenticationValues()
	{
		public string? UserName { get; set; }
		public Guid UserId { get; set; }
		public string? AuthenticationToken { get; set; }
		public string? Challenge { get; set; }
	}

	//public class SerializableCredential
	//{
	//	/// <summary>
	//	/// The Credential ID of the public key credential source.
	//	/// </summary>
	//	[JsonConverter(typeof(Base64UrlConverter))]
	//	public required byte[] Id { get; set; }

	//	/// <summary>
	//	/// The credential public key of the public key credential source.
	//	/// </summary>
	//	[JsonConverter(typeof(Base64UrlConverter))]
	//	public byte[]? PublicKey { get; set; }

	//	/// <summary>
	//	/// The latest value of the signature counter in the authenticator data from any ceremony using the public key credential source.
	//	/// </summary>
	//	public uint SignCount { get; set; }

	//	/// <summary>
	//	/// The value returned from getTransports() when the public key credential source was registered.
	//	/// </summary>
	//	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
	//	public AuthenticatorTransport[]? Transports { get; set; }

	//	/// <summary>
	//	/// The value of the BE flag when the public key credential source was created.
	//	/// </summary>
	//	public bool IsBackupEligible { get; set; }

	//	/// <summary>
	//	/// The latest value of the BS flag in the authenticator data from any ceremony using the public key credential source.
	//	/// </summary>
	//	public bool IsBackedUp { get; set; }

	//	/// <summary>
	//	/// The value of the attestationObject attribute when the public key credential source was registered. 
	//	/// Storing this enables the Relying Party to reference the credential's attestation statement at a later time.
	//	/// </summary>
	//	[JsonConverter(typeof(Base64UrlConverter))]
	//	public byte[]? AttestationObject { get; set; }

	//	/// <summary>
	//	/// The value of the clientDataJSON attribute when the public key credential source was registered. 
	//	/// Storing this in combination with the above attestationObject item enables the Relying Party to re-verify the attestation signature at a later time.
	//	/// </summary>
	//	public byte[]? AttestationClientDataJson { get; set; }

	//	public List<DevicePublicKeys>? DevicePublicKeys { get; set; }

	//	[JsonConverter(typeof(Base64UrlConverter))]
	//	public byte[]? UserId { get; set; }

	//	/// <summary>
	//	/// Exposes an Descriptor Object for this credential, used as input to the library for certain operations.
	//	/// </summary>
	//	public PublicKeyCredentialDescriptor Descriptor => new(PublicKeyCredentialType.PublicKey, Id, Transports);

	//	[JsonConverter(typeof(Base64UrlConverter))]
	//	public byte[]? UserHandle { get; set; }

	//	public string? AttestationFormat { get; set; }

	//	public DateTimeOffset RegDate { get; set; }

	//	public Guid AaGuid { get; set; }
	//}

	//public class DevicePublicKeys
	//{
	//	[JsonConverter(typeof(Base64UrlConverter))]
	//	public byte[]? Data { get; set; }
	//}
}
