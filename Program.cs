using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Net.Http;
using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);
// builder.WebHost.UseUrls("http://localhost:5090");
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var path = ctx.Context.Request.Path.Value ?? "";
        if (path.EndsWith("/app.js", StringComparison.OrdinalIgnoreCase) ||
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

app.MapDelete("/api/rest/{table}", async (string table, HttpRequest req, HttpResponse resp) =>
{
    var pk = req.Query.ContainsKey("pk") ? req.Query["pk"].ToString() : "id";
    var id = req.Query.ContainsKey("id") ? req.Query["id"].ToString() : "";
    var filter = string.IsNullOrEmpty(id) ? "" : $"?{Uri.EscapeDataString(pk)}=eq.{Uri.EscapeDataString(id)}";
    var url = $"{SUPABASE_URL}/rest/v1/{Uri.EscapeDataString(table)}{filter}";
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

app.Run();
