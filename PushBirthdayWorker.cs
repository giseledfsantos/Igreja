namespace Igreja;

using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using WebPush;

public sealed class PushBirthdayWorker : BackgroundService
{
    private readonly ILogger<PushBirthdayWorker> _logger;

    public PushBirthdayWorker(ILogger<PushBirthdayWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var tz = GetSaoPauloTimeZone();
        DateOnly? lastRunDate = null;

        while (!stoppingToken.IsCancellationRequested)
        {
            var nowUtc = DateTimeOffset.UtcNow;
            var nowLocal = TimeZoneInfo.ConvertTime(nowUtc, tz);
            var today = DateOnly.FromDateTime(nowLocal.DateTime);

            if (lastRunDate != today)
            {
                var runAtLocal = nowLocal.DateTime.Date.AddHours(8);
                if (nowLocal.DateTime >= runAtLocal)
                {
                    try
                    {
                        await RunOnceAsync(tz, stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Erro ao enviar notificações de aniversário.");
                    }
                    lastRunDate = today;
                }
            }

            var nextLocal = nowLocal.DateTime.Date.AddDays(1).AddHours(8);
            if (lastRunDate != today && nowLocal.DateTime < nowLocal.DateTime.Date.AddHours(8))
                nextLocal = nowLocal.DateTime.Date.AddHours(8);

            var nextUtc = TimeZoneInfo.ConvertTimeToUtc(nextLocal, tz);
            var delay = nextUtc - DateTime.UtcNow;
            if (delay < TimeSpan.FromSeconds(10)) delay = TimeSpan.FromSeconds(10);

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task RunOnceAsync(TimeZoneInfo tz, CancellationToken ct)
    {
        var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL") ?? "https://xytuuccwylwbefgkqxlr.supabase.co";
        var supabaseKey = Environment.GetEnvironmentVariable("SUPABASE_KEY") ?? "";
        var vapidPublic = Environment.GetEnvironmentVariable("VAPID_PUBLIC_KEY") ?? "";
        var vapidPrivate = Environment.GetEnvironmentVariable("VAPID_PRIVATE_KEY") ?? "";
        var vapidSubject = Environment.GetEnvironmentVariable("VAPID_SUBJECT") ?? "mailto:admin@ieadm-itapeva";

        if (string.IsNullOrWhiteSpace(supabaseKey)) return;
        if (string.IsNullOrWhiteSpace(vapidPublic) || string.IsNullOrWhiteSpace(vapidPrivate)) return;

        var nowLocal = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, tz);
        var today = DateOnly.FromDateTime(nowLocal.DateTime);
        var tomorrow = today.AddDays(1);

        using var http = new HttpClient();
        http.DefaultRequestHeaders.TryAddWithoutValidation("apikey", supabaseKey);
        http.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", "Bearer " + supabaseKey);
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var optedUsers = await GetOptedUserIdsAsync(http, supabaseUrl, ct);
        if (optedUsers.Count == 0) return;

        var subs = await GetActiveSubscriptionsAsync(http, supabaseUrl, ct);
        subs = subs.Where(s => optedUsers.Contains(s.IdUsuario)).ToList();
        if (subs.Count == 0) return;

        var members = await GetMembersWithBirthdayDataAsync(http, supabaseUrl, ct);
        if (members.Count == 0) return;

        var birthdaysToday = members
            .Where(m => m.DataNascimento.HasValue && m.DataNascimento.Value.Month == today.Month && m.DataNascimento.Value.Day == today.Day)
            .ToList();
        var birthdaysTomorrow = members
            .Where(m => m.DataNascimento.HasValue && m.DataNascimento.Value.Month == tomorrow.Month && m.DataNascimento.Value.Day == tomorrow.Day)
            .ToList();

        if (birthdaysToday.Count == 0 && birthdaysTomorrow.Count == 0) return;

        var vapid = new VapidDetails(vapidSubject, vapidPublic, vapidPrivate);
        var client = new WebPushClient();

        var revokeIds = new HashSet<long>();

        foreach (var sub in subs)
        {
            foreach (var m in birthdaysTomorrow)
            {
                var body = "Amanhã é aniversario de " + m.Nome;
                var payload = JsonSerializer.Serialize(new { title = "IEADM-ITAPEVA", body, tag = $"bday-{m.Id}-tomorrow-{today:yyyyMMdd}", url = "/" });
                await SendWithRevokeHandlingAsync(client, vapid, sub, payload, revokeIds, ct);
            }
            foreach (var m in birthdaysToday)
            {
                var body = "Hoje é aniversario de " + m.Nome;
                var payload = JsonSerializer.Serialize(new { title = "IEADM-ITAPEVA", body, tag = $"bday-{m.Id}-today-{today:yyyyMMdd}", url = "/" });
                await SendWithRevokeHandlingAsync(client, vapid, sub, payload, revokeIds, ct);
            }
        }

        if (revokeIds.Count > 0)
        {
            await RevokeSubscriptionsAsync(http, supabaseUrl, revokeIds, ct);
        }
    }

    private static async Task SendWithRevokeHandlingAsync(WebPushClient client, VapidDetails vapid, SubscriptionRow sub, string payload, HashSet<long> revokeIds, CancellationToken ct)
    {
        var ps = new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
        try
        {
            await client.SendNotificationAsync(ps, payload, vapid, ct);
        }
        catch (WebPushException ex) when (ex.StatusCode is HttpStatusCode.Gone or HttpStatusCode.NotFound)
        {
            revokeIds.Add(sub.Id);
        }
    }

    private static async Task<HashSet<long>> GetOptedUserIdsAsync(HttpClient http, string supabaseUrl, CancellationToken ct)
    {
        var url = $"{supabaseUrl}/rest/v1/usuarios?select=id,recebe_notificacoes&recebe_notificacoes=eq.true";
        using var res = await http.GetAsync(url, ct);
        if (!res.IsSuccessStatusCode) return new HashSet<long>();
        var json = await res.Content.ReadAsStringAsync(ct);
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return new HashSet<long>();
            var set = new HashSet<long>();
            foreach (var el in doc.RootElement.EnumerateArray())
            {
                if (el.TryGetProperty("id", out var idEl) && idEl.ValueKind == JsonValueKind.Number)
                {
                    set.Add(idEl.GetInt64());
                }
            }
            return set;
        }
        catch
        {
            return new HashSet<long>();
        }
    }

    private static async Task<List<SubscriptionRow>> GetActiveSubscriptionsAsync(HttpClient http, string supabaseUrl, CancellationToken ct)
    {
        var url = $"{supabaseUrl}/rest/v1/push_subscriptions?select=id,id_usuario,endpoint,p256dh,auth,revoked_at&revoked_at=is.null";
        using var res = await http.GetAsync(url, ct);
        if (!res.IsSuccessStatusCode) return new List<SubscriptionRow>();
        var json = await res.Content.ReadAsStringAsync(ct);
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return new List<SubscriptionRow>();
            var list = new List<SubscriptionRow>();
            foreach (var el in doc.RootElement.EnumerateArray())
            {
                if (!el.TryGetProperty("id", out var idEl) || idEl.ValueKind != JsonValueKind.Number) continue;
                if (!el.TryGetProperty("id_usuario", out var uEl) || uEl.ValueKind != JsonValueKind.Number) continue;
                var endpoint = el.TryGetProperty("endpoint", out var epEl) ? (epEl.GetString() ?? "") : "";
                var p256dh = el.TryGetProperty("p256dh", out var pEl) ? (pEl.GetString() ?? "") : "";
                var auth = el.TryGetProperty("auth", out var aEl) ? (aEl.GetString() ?? "") : "";
                if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(p256dh) || string.IsNullOrWhiteSpace(auth)) continue;
                list.Add(new SubscriptionRow(idEl.GetInt64(), uEl.GetInt64(), endpoint, p256dh, auth));
            }
            return list;
        }
        catch
        {
            return new List<SubscriptionRow>();
        }
    }

    private static async Task<List<MemberRow>> GetMembersWithBirthdayDataAsync(HttpClient http, string supabaseUrl, CancellationToken ct)
    {
        var url = $"{supabaseUrl}/rest/v1/membros?select=id,nome,data_nascimento&data_nascimento=is.not.null";
        using var res = await http.GetAsync(url, ct);
        if (!res.IsSuccessStatusCode) return new List<MemberRow>();
        var json = await res.Content.ReadAsStringAsync(ct);
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return new List<MemberRow>();
            var list = new List<MemberRow>();
            foreach (var el in doc.RootElement.EnumerateArray())
            {
                if (!el.TryGetProperty("id", out var idEl) || idEl.ValueKind != JsonValueKind.Number) continue;
                var nome = el.TryGetProperty("nome", out var nEl) ? (nEl.GetString() ?? "") : "";
                if (string.IsNullOrWhiteSpace(nome)) continue;
                DateOnly? dn = null;
                if (el.TryGetProperty("data_nascimento", out var dEl) && dEl.ValueKind == JsonValueKind.String)
                {
                    var s = dEl.GetString() ?? "";
                    if (DateOnly.TryParse(s, out var parsed)) dn = parsed;
                }
                list.Add(new MemberRow(idEl.GetInt64(), nome, dn));
            }
            return list;
        }
        catch
        {
            return new List<MemberRow>();
        }
    }

    private static async Task RevokeSubscriptionsAsync(HttpClient http, string supabaseUrl, HashSet<long> ids, CancellationToken ct)
    {
        var nowIso = DateTimeOffset.UtcNow.ToString("O");
        foreach (var id in ids)
        {
            var url = $"{supabaseUrl}/rest/v1/push_subscriptions?id=eq.{id}";
            var msg = new HttpRequestMessage(HttpMethod.Patch, url);
            msg.Headers.TryAddWithoutValidation("Prefer", "return=representation");
            msg.Content = new StringContent(JsonSerializer.Serialize(new { revoked_at = nowIso, updated_at = nowIso }), Encoding.UTF8, "application/json");
            try { await http.SendAsync(msg, ct); } catch { }
        }
    }

    private static TimeZoneInfo GetSaoPauloTimeZone()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"); } catch { }
        try { return TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"); } catch { }
        return TimeZoneInfo.Local;
    }

    private sealed record SubscriptionRow(long Id, long IdUsuario, string Endpoint, string P256dh, string Auth);
    private sealed record MemberRow(long Id, string Nome, DateOnly? DataNascimento);
}
