using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using WebPush;

var builder = WebApplication.CreateBuilder(args);
// builder.WebHost.UseUrls("http://localhost:5090");
builder.Services.AddHostedService<Igreja.PushBirthdayWorker>();
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var path = ctx.Context.Request.Path.Value ?? "";
        if (path.EndsWith("/app.js", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith("/sw.js", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith("/manifest.json", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith("/schema.json", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith("/styles.css", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith("/", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
            ctx.Context.Response.Headers["Pragma"] = "no-cache";
            ctx.Context.Response.Headers["Expires"] = "0";
        }
    }
});

app.MapGet("/health", () => "OK");

string SUPABASE_URL = Environment.GetEnvironmentVariable("SUPABASE_URL") ?? "https://xytuuccwylwbefgkqxlr.supabase.co";
string SUPABASE_KEY = Environment.GetEnvironmentVariable("SUPABASE_KEY") ?? "";
string VAPID_PUBLIC_KEY = Environment.GetEnvironmentVariable("VAPID_PUBLIC_KEY") ?? "";
string VAPID_PRIVATE_KEY = Environment.GetEnvironmentVariable("VAPID_PRIVATE_KEY") ?? "";
string VAPID_SUBJECT = Environment.GetEnvironmentVariable("VAPID_SUBJECT") ?? "mailto:admin@ieadm-itapeva";

if (string.IsNullOrWhiteSpace(VAPID_PUBLIC_KEY) || string.IsNullOrWhiteSpace(VAPID_PRIVATE_KEY))
{
    try
    {
        var keys = VapidHelper.GenerateVapidKeys();
        VAPID_PUBLIC_KEY = keys.PublicKey;
        VAPID_PRIVATE_KEY = keys.PrivateKey;
        Environment.SetEnvironmentVariable("VAPID_PUBLIC_KEY", VAPID_PUBLIC_KEY, EnvironmentVariableTarget.Process);
        Environment.SetEnvironmentVariable("VAPID_PRIVATE_KEY", VAPID_PRIVATE_KEY, EnvironmentVariableTarget.Process);
    }
    catch { }
}

string ResolveApiKey(HttpRequest req)
{
    if (!string.IsNullOrWhiteSpace(SUPABASE_KEY)) return SUPABASE_KEY;
    if (req.Headers.TryGetValue("apikey", out var apikey) && !string.IsNullOrWhiteSpace(apikey.ToString()))
        return apikey.ToString();
    if (req.Headers.TryGetValue("Authorization", out var auth))
    {
        var s = auth.ToString();
        if (s.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            s = s.Substring(7).Trim();
        if (!string.IsNullOrWhiteSpace(s)) return s;
    }
    return "";
}

void CopyHeaders(HttpRequest req, HttpRequestMessage msg)
{
    if (!string.IsNullOrEmpty(SUPABASE_KEY))
    {
        msg.Headers.TryAddWithoutValidation("apikey", SUPABASE_KEY);
        msg.Headers.TryAddWithoutValidation("Authorization", "Bearer " + SUPABASE_KEY);
    }
    else
    {
        if (req.Headers.TryGetValue("apikey", out var apikey))
            msg.Headers.TryAddWithoutValidation("apikey", apikey.ToString());
        if (req.Headers.TryGetValue("Authorization", out var auth))
            msg.Headers.TryAddWithoutValidation("Authorization", auth.ToString());
    }
    msg.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
}

app.MapGet("/api/rest/{table}", async (string table, HttpRequest req, HttpResponse resp) =>
{
    var query = req.QueryString.HasValue ? req.QueryString.Value : "";
    if (string.IsNullOrEmpty(query))
        query = "?select=*";
    else if (!req.Query.ContainsKey("select"))
        query += "&select=*";
    var url = $"{SUPABASE_URL}/rest/v1/{Uri.EscapeDataString(table)}{query}";
    using var client = new HttpClient();
    var msg = new HttpRequestMessage(HttpMethod.Get, url);
    CopyHeaders(req, msg);
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    resp.StatusCode = (int)res.StatusCode;
    resp.ContentType = "application/json";
    await resp.WriteAsync(content);
});

app.MapGet("/db/rest/{table}", async (string table, HttpRequest req, HttpResponse resp) =>
{
    var query = req.QueryString.HasValue ? req.QueryString.Value : "";
    if (string.IsNullOrEmpty(query))
        query = "?select=*";
    else if (!req.Query.ContainsKey("select"))
        query += "&select=*";
    var url = $"{SUPABASE_URL}/rest/v1/{Uri.EscapeDataString(table)}{query}";
    using var client = new HttpClient();
    var msg = new HttpRequestMessage(HttpMethod.Get, url);
    CopyHeaders(req, msg);
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    resp.StatusCode = (int)res.StatusCode;
    resp.ContentType = "application/json";
    await resp.WriteAsync(content);
});

app.MapPost("/api/rest/{table}", async (string table, HttpRequest req, HttpResponse resp) =>
{
    var url = $"{SUPABASE_URL}/rest/v1/{Uri.EscapeDataString(table)}";
    using var client = new HttpClient();
    var body = await new StreamReader(req.Body).ReadToEndAsync();
    var msg = new HttpRequestMessage(HttpMethod.Post, url);
    CopyHeaders(req, msg);
    msg.Headers.TryAddWithoutValidation("Prefer", "return=representation");
    msg.Content = new StringContent(body);
    msg.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    resp.StatusCode = (int)res.StatusCode;
    resp.ContentType = "application/json";
    await resp.WriteAsync(content);
});

app.MapPost("/db/rest/{table}", async (string table, HttpRequest req, HttpResponse resp) =>
{
    var url = $"{SUPABASE_URL}/rest/v1/{Uri.EscapeDataString(table)}";
    using var client = new HttpClient();
    var body = await new StreamReader(req.Body).ReadToEndAsync();
    var msg = new HttpRequestMessage(HttpMethod.Post, url);
    CopyHeaders(req, msg);
    msg.Headers.TryAddWithoutValidation("Prefer", "return=representation");
    msg.Content = new StringContent(body);
    msg.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    resp.StatusCode = (int)res.StatusCode;
    resp.ContentType = "application/json";
    await resp.WriteAsync(content);
});

app.MapPatch("/api/rest/{table}", async (string table, HttpRequest req, HttpResponse resp) =>
{
    var pk = req.Query.ContainsKey("pk") ? req.Query["pk"].ToString() : "id";
    var id = req.Query.ContainsKey("id") ? req.Query["id"].ToString() : "";
    var filter = string.IsNullOrEmpty(id) ? "" : $"?{Uri.EscapeDataString(pk)}=eq.{Uri.EscapeDataString(id)}";
    var url = $"{SUPABASE_URL}/rest/v1/{Uri.EscapeDataString(table)}{filter}";
    using var client = new HttpClient();
    var body = await new StreamReader(req.Body).ReadToEndAsync();
    var msg = new HttpRequestMessage(HttpMethod.Patch, url);
    CopyHeaders(req, msg);
    msg.Headers.TryAddWithoutValidation("Prefer", "return=representation");
    msg.Content = new StringContent(body);
    msg.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    resp.StatusCode = (int)res.StatusCode;
    resp.ContentType = "application/json";
    await resp.WriteAsync(content);
});

app.MapPatch("/db/rest/{table}", async (string table, HttpRequest req, HttpResponse resp) =>
{
    var pk = req.Query.ContainsKey("pk") ? req.Query["pk"].ToString() : "id";
    var id = req.Query.ContainsKey("id") ? req.Query["id"].ToString() : "";
    var filter = string.IsNullOrEmpty(id) ? "" : $"?{Uri.EscapeDataString(pk)}=eq.{Uri.EscapeDataString(id)}";
    var url = $"{SUPABASE_URL}/rest/v1/{Uri.EscapeDataString(table)}{filter}";
    using var client = new HttpClient();
    var body = await new StreamReader(req.Body).ReadToEndAsync();
    var msg = new HttpRequestMessage(HttpMethod.Patch, url);
    CopyHeaders(req, msg);
    msg.Headers.TryAddWithoutValidation("Prefer", "return=representation");
    msg.Content = new StringContent(body);
    msg.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    resp.StatusCode = (int)res.StatusCode;
    resp.ContentType = "application/json";
    await resp.WriteAsync(content);
});

app.MapDelete("/api/rest/{table}", async (string table, HttpRequest req, HttpResponse resp) =>
{
    var query = req.QueryString.HasValue ? req.QueryString.Value : "";
    if (req.Query.ContainsKey("pk") && req.Query.ContainsKey("id"))
    {
        var pk = req.Query["pk"].ToString();
        var id = req.Query["id"].ToString();
        var filter = string.IsNullOrEmpty(id) ? "" : $"?{Uri.EscapeDataString(pk)}=eq.{Uri.EscapeDataString(id)}";
        query = filter;
    }
    if (string.IsNullOrEmpty(query))
    {
        resp.StatusCode = StatusCodes.Status400BadRequest;
        resp.ContentType = "application/json";
        await resp.WriteAsync("{\"message\":\"DELETE requires filters\"}");
        return;
    }
    var url = $"{SUPABASE_URL}/rest/v1/{Uri.EscapeDataString(table)}{query}";
    using var client = new HttpClient();
    var msg = new HttpRequestMessage(HttpMethod.Delete, url);
    CopyHeaders(req, msg);
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    if (string.IsNullOrEmpty(content)) content = "";
    resp.StatusCode = (int)res.StatusCode;
    resp.ContentType = "application/json";
    await resp.WriteAsync(content);
});

app.MapDelete("/db/rest/{table}", async (string table, HttpRequest req, HttpResponse resp) =>
{
    var query = req.QueryString.HasValue ? req.QueryString.Value : "";
    if (req.Query.ContainsKey("pk") && req.Query.ContainsKey("id"))
    {
        var pk = req.Query["pk"].ToString();
        var id = req.Query["id"].ToString();
        var filter = string.IsNullOrEmpty(id) ? "" : $"?{Uri.EscapeDataString(pk)}=eq.{Uri.EscapeDataString(id)}";
        query = filter;
    }
    if (string.IsNullOrEmpty(query))
    {
        resp.StatusCode = StatusCodes.Status400BadRequest;
        resp.ContentType = "application/json";
        await resp.WriteAsync("{\"message\":\"DELETE requires filters\"}");
        return;
    }
    var url = $"{SUPABASE_URL}/rest/v1/{Uri.EscapeDataString(table)}{query}";
    using var client = new HttpClient();
    var msg = new HttpRequestMessage(HttpMethod.Delete, url);
    CopyHeaders(req, msg);
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    if (string.IsNullOrEmpty(content)) content = "";
    resp.StatusCode = (int)res.StatusCode;
    resp.ContentType = "application/json";
    await resp.WriteAsync(content);
});

app.MapGet("/api/push/vapid-public-key", () =>
{
    if (string.IsNullOrWhiteSpace(VAPID_PUBLIC_KEY))
        return Results.Problem("VAPID_PUBLIC_KEY não configurada.");
    return Results.Json(new { publicKey = VAPID_PUBLIC_KEY });
});

app.MapGet("/api/push/has-subscription", async (HttpRequest req) =>
{
    var idUsuario = req.Query.ContainsKey("id_usuario") ? req.Query["id_usuario"].ToString() : "";
    idUsuario = string.IsNullOrWhiteSpace(idUsuario) && req.Query.ContainsKey("idUsuario") ? req.Query["idUsuario"].ToString() : idUsuario;
    if (string.IsNullOrWhiteSpace(idUsuario)) return Results.BadRequest(new { message = "id_usuario obrigatório." });
    if (!long.TryParse(idUsuario, out var idUsuarioNum)) return Results.BadRequest(new { message = "id_usuario inválido." });
    var apiKey = ResolveApiKey(req);
    if (string.IsNullOrWhiteSpace(apiKey)) return Results.Problem("SUPABASE_KEY não configurada.");

    var url = $"{SUPABASE_URL}/rest/v1/push_subscriptions?select=id&id_usuario=eq.{idUsuarioNum}&revoked_at=is.null&limit=1";
    using var client = new HttpClient();
    var msg = new HttpRequestMessage(HttpMethod.Get, url);
    msg.Headers.TryAddWithoutValidation("apikey", apiKey);
    msg.Headers.TryAddWithoutValidation("Authorization", "Bearer " + apiKey);
    msg.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    if (!res.IsSuccessStatusCode) return Results.StatusCode((int)res.StatusCode);
    bool has = false;
    try
    {
        using var doc = JsonDocument.Parse(content);
        has = doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0;
    }
    catch { }
    return Results.Json(new { hasSubscription = has });
});

app.MapPost("/api/push/subscribe", async (HttpRequest req) =>
{
    var apiKey = ResolveApiKey(req);
    if (string.IsNullOrWhiteSpace(apiKey)) return Results.Problem("SUPABASE_KEY não configurada.");
    if (string.IsNullOrWhiteSpace(VAPID_PUBLIC_KEY) || string.IsNullOrWhiteSpace(VAPID_PRIVATE_KEY)) return Results.Problem("VAPID não configurado.");

    using var doc = await JsonDocument.ParseAsync(req.Body);
    var root = doc.RootElement;
    string idUsuario = "";
    if (root.TryGetProperty("idUsuario", out var idU) && idU.ValueKind == JsonValueKind.String) idUsuario = idU.GetString() ?? "";
    if (string.IsNullOrWhiteSpace(idUsuario) && root.TryGetProperty("id_usuario", out var idU2) && idU2.ValueKind == JsonValueKind.String) idUsuario = idU2.GetString() ?? "";
    if (string.IsNullOrWhiteSpace(idUsuario) && root.TryGetProperty("id_usuario", out var idU3) && idU3.ValueKind == JsonValueKind.Number) idUsuario = idU3.GetInt64().ToString();
    if (string.IsNullOrWhiteSpace(idUsuario) && root.TryGetProperty("idUsuario", out var idU4) && idU4.ValueKind == JsonValueKind.Number) idUsuario = idU4.GetInt64().ToString();
    if (string.IsNullOrWhiteSpace(idUsuario)) return Results.BadRequest(new { message = "idUsuario obrigatório." });
    if (!long.TryParse(idUsuario, out var idUsuarioNum)) return Results.BadRequest(new { message = "idUsuario inválido." });

    JsonElement subEl;
    if (root.TryGetProperty("subscription", out var subProp)) subEl = subProp;
    else subEl = root;

    if (!subEl.TryGetProperty("endpoint", out var epEl)) return Results.BadRequest(new { message = "subscription.endpoint obrigatório." });
    var endpoint = epEl.GetString() ?? "";
    if (string.IsNullOrWhiteSpace(endpoint)) return Results.BadRequest(new { message = "subscription.endpoint obrigatório." });

    string p256dh = "";
    string auth = "";
    if (subEl.TryGetProperty("keys", out var keysEl) && keysEl.ValueKind == JsonValueKind.Object)
    {
        if (keysEl.TryGetProperty("p256dh", out var pEl)) p256dh = pEl.GetString() ?? "";
        if (keysEl.TryGetProperty("auth", out var aEl)) auth = aEl.GetString() ?? "";
    }
    if (string.IsNullOrWhiteSpace(p256dh) || string.IsNullOrWhiteSpace(auth)) return Results.BadRequest(new { message = "subscription.keys inválido." });

    string userAgent = "";
    if (root.TryGetProperty("userAgent", out var uaEl) && uaEl.ValueKind == JsonValueKind.String) userAgent = uaEl.GetString() ?? "";
    if (string.IsNullOrWhiteSpace(userAgent)) userAgent = req.Headers.UserAgent.ToString();

    var nowIso = DateTimeOffset.UtcNow.ToString("O");
    var payload = new
    {
        id_usuario = idUsuarioNum,
        endpoint,
        p256dh,
        auth,
        user_agent = userAgent,
        last_seen_at = nowIso,
        revoked_at = (string?)null,
        updated_at = nowIso
    };

    var url = $"{SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=id_usuario,endpoint";
    using var client = new HttpClient();
    var msg = new HttpRequestMessage(HttpMethod.Post, url);
    msg.Headers.TryAddWithoutValidation("apikey", apiKey);
    msg.Headers.TryAddWithoutValidation("Authorization", "Bearer " + apiKey);
    msg.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    msg.Headers.TryAddWithoutValidation("Prefer", "resolution=merge-duplicates,return=representation");
    msg.Content = new StringContent(JsonSerializer.Serialize(new[] { payload }), Encoding.UTF8, "application/json");
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    if (!res.IsSuccessStatusCode) return Results.Text(content, "application/json", Encoding.UTF8, (int)res.StatusCode);
    return Results.Text(content, "application/json");
});

app.MapPost("/api/push/unsubscribe", async (HttpRequest req) =>
{
    var apiKey = ResolveApiKey(req);
    if (string.IsNullOrWhiteSpace(apiKey)) return Results.Problem("SUPABASE_KEY não configurada.");

    using var doc = await JsonDocument.ParseAsync(req.Body);
    var root = doc.RootElement;
    string idUsuario = "";
    if (root.TryGetProperty("idUsuario", out var idU) && idU.ValueKind == JsonValueKind.String) idUsuario = idU.GetString() ?? "";
    if (string.IsNullOrWhiteSpace(idUsuario) && root.TryGetProperty("id_usuario", out var idU2) && idU2.ValueKind == JsonValueKind.String) idUsuario = idU2.GetString() ?? "";
    if (string.IsNullOrWhiteSpace(idUsuario) && root.TryGetProperty("id_usuario", out var idU3) && idU3.ValueKind == JsonValueKind.Number) idUsuario = idU3.GetInt64().ToString();
    if (string.IsNullOrWhiteSpace(idUsuario) && root.TryGetProperty("idUsuario", out var idU4) && idU4.ValueKind == JsonValueKind.Number) idUsuario = idU4.GetInt64().ToString();
    if (string.IsNullOrWhiteSpace(idUsuario)) return Results.BadRequest(new { message = "idUsuario obrigatório." });
    if (!long.TryParse(idUsuario, out var idUsuarioNum)) return Results.BadRequest(new { message = "idUsuario inválido." });

    var endpoint = "";
    if (root.TryGetProperty("endpoint", out var epEl) && epEl.ValueKind == JsonValueKind.String) endpoint = epEl.GetString() ?? "";
    if (string.IsNullOrWhiteSpace(endpoint)) return Results.BadRequest(new { message = "endpoint obrigatório." });

    var nowIso = DateTimeOffset.UtcNow.ToString("O");
    var url = $"{SUPABASE_URL}/rest/v1/push_subscriptions?id_usuario=eq.{idUsuarioNum}&endpoint=eq.{Uri.EscapeDataString(endpoint)}";
    using var client = new HttpClient();
    var msg = new HttpRequestMessage(HttpMethod.Patch, url);
    msg.Headers.TryAddWithoutValidation("apikey", apiKey);
    msg.Headers.TryAddWithoutValidation("Authorization", "Bearer " + apiKey);
    msg.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    msg.Headers.TryAddWithoutValidation("Prefer", "return=representation");
    msg.Content = new StringContent(JsonSerializer.Serialize(new { revoked_at = nowIso, updated_at = nowIso }), Encoding.UTF8, "application/json");
    var res = await client.SendAsync(msg);
    var content = await res.Content.ReadAsStringAsync();
    if (!res.IsSuccessStatusCode) return Results.Text(content, "application/json", Encoding.UTF8, (int)res.StatusCode);
    return Results.Text(content, "application/json");
});

app.Run();
