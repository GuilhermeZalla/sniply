using System.Net;
using System.Net.Mail;
using System.Text.Json;
namespace Sniply.Application;

public sealed class ResetMail(IConfiguration config, IWebHostEnvironment env, ILogger<ResetMail> log)
{
    public async Task Send(string email, string url, CancellationToken ct)
    {
        var host = config["Mail:Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            if (!env.IsDevelopment() && !env.IsEnvironment("Testing"))
            {
                log.LogError("Password recovery delivery is not configured.");
                return;
            }
            var folder = Path.GetFullPath(config["Mail:DropDirectory"] ?? Path.Combine(env.ContentRootPath, ".mail"));
            Directory.CreateDirectory(folder);
            await File.WriteAllTextAsync(Path.Combine(folder, Guid.NewGuid() + ".json"), JsonSerializer.Serialize(new
            {
                To = email,
                Subject = "Reset your Sniply password",
                Url = url
            }), ct);
            return;
        }
        using var smtp = new SmtpClient(host, config.GetValue("Mail:Port", 587)) { EnableSsl = config.GetValue("Mail:Tls", true), Timeout = 15000 };
        if (!string.IsNullOrEmpty(config["Mail:Username"]))
            smtp.Credentials = new NetworkCredential(config["Mail:Username"], config["Mail:Password"]);
        using var message = new MailMessage(config["Mail:From"] ?? throw new InvalidOperationException("Mail:From is required."), email, "Reset your Sniply password", "Use this link within 30 minutes to reset your password:\n" + url + "\nIf you did not request this, ignore this message.");
        await smtp.SendMailAsync(message, ct);
    }
}
