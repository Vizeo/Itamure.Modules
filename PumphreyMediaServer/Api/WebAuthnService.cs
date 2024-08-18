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
using System.Net;
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
        private const string CHALLENGE = "challange";
        private const string INSTALL_ID = "installId";
        private static Random random = new();

        public WebAuthnService()
        {
        }

        [Api]
        public CreateTokenResult CreateToken(string accessCode, string installId)
        {
            var result = new CreateTokenResult();

            //Claim the token
            var accessTokenResult = Module.CurrentModule!.CreateAccessToken(accessCode);

            if (accessTokenResult.Success)
            {
                var webAuthnCredential = new WebAuthnCredential()
                {
                    UserName = accessTokenResult.UserName,
                    TimeStamp = DateTime.UtcNow,
                    AccessToken = accessTokenResult.Token,
                    InstallId = installId
                };

                Module.ObjectStore!.Store(webAuthnCredential);
                result.Success = true;

            }
            else
            {
                result.FailureMessage = accessTokenResult.FailureMessage;
            }

            return result;
        }

        [Api]
        public string GetChallenge(string installId)
        {
            var challenge = RandomString(32);
            Session[CHALLENGE] = challenge;
            Session[INSTALL_ID] = installId;
            return challenge;
        }

        [Api]
        public string? GetCredentialOptions(string challange)
        {
            if (challange != (string)Session[CHALLENGE])
            {
                throw new Exception("Bad challange.");
            }

            var webAuthnCredential = Module.ObjectStore!.Retrieve<WebAuthnCredential>()
                .First(w => w.InstallId == (string)Session[INSTALL_ID]);

            var user = new Fido2User
            {
                DisplayName = webAuthnCredential.UserName,
                Name = webAuthnCredential.UserName,
                Id = Encoding.UTF8.GetBytes(webAuthnCredential.UserName!)
            };

            var authenticatorSelection = new AuthenticatorSelection
            {
                ResidentKey = ResidentKeyRequirement.Discouraged,
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

            var options = GetFido2().RequestNewCredential(user, new PublicKeyCredentialDescriptor[0], authenticatorSelection, AttestationConveyancePreference.Direct, exts);
            options.Timeout = 600000;

			//Temporarily store options, session/in-memory cache/redis/db
			var json = options.ToJson();
            Session[ATTESTATION_OPTIONS] = json;
            return json;
        }

        [Api]
        public async Task<SaveCredentialResult> SaveCredential(string json)
        {
            var attestationResponse = System.Text.Json.JsonSerializer.Deserialize<AuthenticatorAttestationRawResponse>(json);
            var result = new SaveCredentialResult();

            await Task.Delay(5000); //Make sure the claim has had enough time

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

                //The entry should already exist.
                var webAuthnCredential = Module.ObjectStore!.Retrieve<WebAuthnCredential>()
                    .First(w => w.InstallId == (string)Session[INSTALL_ID]);

                webAuthnCredential.CredentialJson = credentialJson;
                webAuthnCredential.DevicePublicKeys = new List<byte[]>() { credential.DevicePublicKey };

                Module.ObjectStore!.Store(webAuthnCredential);
                Module.CurrentModule!.AuthenticateWithAccessToken(Session.UniqueId, webAuthnCredential.AccessToken!);
                result.Success = true;
			}
            catch (Exception e)
            {
				//return Json(new { status = "error", errorMessage = FormatException(e) });
				result.FailureMessage = e.Message;
                Module.CurrentModule!.LogException(e, SystemLogType.Warning, GetType().Assembly.FullName);
				throw e;
            }

            return result; //TODO: Use a confirmation object
        }

        [Api]
        public string GetAssertionOptions(string installId)
        {
            try
            {
                var existingCredentials = new List<RegisteredPublicKeyCredential>();
                var existingCredentialDescriptors = new List<PublicKeyCredentialDescriptor>();
                var credentialDictionary = new Dictionary<RegisteredPublicKeyCredential, WebAuthnCredential>();

                if (!string.IsNullOrEmpty(installId))
                {
                    // 1. Get registered credentials from database
                    var webAuthnCredentials = Module.ObjectStore!.Retrieve<WebAuthnCredential>()
                        .Where(c => c.InstallId == installId) //There should only be one
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

                webAuthnCredential.LastUsedDate = DateTime.UtcNow;

                // 6. Store the updated counter
                //DemoStorage.UpdateCounter(res.CredentialId, res.SignCount);
                Module.ObjectStore!.Store(webAuthnCredential);

                // 7. return OK to client
                //return System.Text.Json.JsonSerializer.Serialize(res);
                Module.CurrentModule!.AuthenticateWithAccessToken(Session.UniqueId, webAuthnCredential.AccessToken!);
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
            var protocol = Request.IsSecure ? "HTTPS" : "HTTP";
            var origins = $"{protocol}://{host}";

			var configuration = new Fido2Configuration()
            {
                ServerDomain = host,
                ServerName = host,
                Origins = new HashSet<string> { origins },
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
}
