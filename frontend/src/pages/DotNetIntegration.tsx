import { motion } from "framer-motion";
import { Database, Shield, Zap, Server, ArrowRight, CheckCircle2, AlertTriangle, Code2, Settings, Lock } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

function Section({ title, icon: Icon, children, delay = 0 }: { title: string; icon: typeof Database; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-arsenal-red/20 border border-arsenal-red/30">
          <Icon className="w-5 h-5 text-arsenal-red" />
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/40 overflow-hidden">
      <div className="px-3 py-1.5 bg-white/5 border-b border-white/10 text-xs text-white/50 font-mono">{language}</div>
      <pre className="p-4 text-sm text-green-300/90 font-mono overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  );
}

function ArchitectureDiagram() {
  const nodes = [
    { label: ".NET / C# App", sub: "Your Application", x: 50, color: "from-purple-500/30 to-purple-700/30", border: "border-purple-400/40" },
    { label: "Databricks ODBC", sub: "Simba Driver", x: 250, color: "from-orange-500/30 to-orange-700/30", border: "border-orange-400/40" },
    { label: "Databricks SQL", sub: "Serverless Warehouse", x: 450, color: "from-red-500/30 to-red-700/30", border: "border-red-400/40" },
    { label: "Lakebase", sub: "PostgreSQL (Managed)", x: 650, color: "from-blue-500/30 to-blue-700/30", border: "border-blue-400/40" },
  ];

  return (
    <div className="relative w-full overflow-x-auto py-6">
      <div className="flex items-center justify-between min-w-[700px] px-4">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.15 }}
              className={`relative w-40 p-4 rounded-xl border ${node.border} bg-gradient-to-br ${node.color} backdrop-blur-sm text-center`}
            >
              <p className="text-white font-semibold text-sm">{node.label}</p>
              <p className="text-white/50 text-xs mt-1">{node.sub}</p>
            </motion.div>
            {i < nodes.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15 + 0.1 }}
                className="mx-2 flex items-center"
              >
                <div className="w-8 h-px bg-gradient-to-r from-white/40 to-white/20" />
                <ArrowRight className="w-4 h-4 text-white/40" />
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <Zap className="w-3 h-3" /> Direct Connection — No S3 Staging Required
        </span>
      </div>
    </div>
  );
}

export default function DotNetIntegration() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-3xl font-display tracking-wider text-white uppercase">.NET / C# Integration</h1>
        <p className="text-white/60 mt-2 max-w-2xl mx-auto">
          Direct connection from .NET/C# applications to Databricks via ODBC — eliminating the S3 staging layer for a simplified, secure, and scalable architecture.
        </p>
      </motion.div>

      {/* Architecture Diagram */}
      <Section title="Recommended Architecture" icon={Server} delay={0.1}>
        <ArchitectureDiagram />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-emerald-400 font-medium text-sm">Simplified Flow (Recommended)</p>
            <p className="text-white/60 text-xs mt-1">.NET App → ODBC Driver → Databricks SQL Warehouse → Lakebase</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-red-400 font-medium text-sm">Legacy Flow (Eliminated)</p>
            <p className="text-white/60 text-xs mt-1 line-through">.NET App → S3 Bucket → Databricks Ingest → Delta Lake</p>
          </div>
        </div>
      </Section>

      {/* ODBC Configuration */}
      <Section title="ODBC Connector Configuration" icon={Settings} delay={0.2}>
        <p className="text-white/70 text-sm mb-3">
          Use the <strong className="text-white">Databricks Simba ODBC Driver</strong> to connect your .NET application directly to a Databricks SQL Warehouse.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="text-white/90 font-medium text-sm mb-2">1. Install the Simba ODBC Driver</h3>
            <p className="text-white/60 text-xs">Download from <span className="text-arsenal-gold">Databricks Partner Connect</span> or the Simba website. Supports Windows, Linux, and macOS.</p>
          </div>

          <div>
            <h3 className="text-white/90 font-medium text-sm mb-2">2. DSN Configuration (odbc.ini / Windows ODBC Manager)</h3>
            <CodeBlock language="ini" code={`[DatabricksODBC]
Driver          = /opt/simba/spark/lib/64/libsparkodbc_sb64.so
Host            = <workspace>.cloud.databricks.com
Port            = 443
HTTPPath        = /sql/1.0/warehouses/<warehouse-id>
SSL             = 1
ThriftTransport = 2
AuthMech        = 11
Auth_Flow       = 0
Auth_AccessToken = dapi...  ; or use OAuth below`} />
          </div>

          <div>
            <h3 className="text-white/90 font-medium text-sm mb-2">3. Connection String (Inline in .NET)</h3>
            <CodeBlock language="csharp" code={`// Connection string for System.Data.Odbc
string connectionString = 
    "Driver={Simba Spark ODBC Driver};" +
    "Host=<workspace>.cloud.databricks.com;" +
    "Port=443;" +
    "HTTPPath=/sql/1.0/warehouses/<warehouse-id>;" +
    "SSL=1;" +
    "ThriftTransport=2;" +
    "AuthMech=11;" +
    "Auth_Flow=0;" +
    "Auth_AccessToken=<your-token>;";`} />
          </div>

          <div>
            <h3 className="text-white/90 font-medium text-sm mb-2">4. OAuth (M2M) — Recommended for Production</h3>
            <CodeBlock language="csharp" code={`// OAuth2 Machine-to-Machine with Service Principal
string connectionString = 
    "Driver={Simba Spark ODBC Driver};" +
    "Host=<workspace>.cloud.databricks.com;" +
    "Port=443;" +
    "HTTPPath=/sql/1.0/warehouses/<warehouse-id>;" +
    "SSL=1;" +
    "ThriftTransport=2;" +
    "AuthMech=11;" +
    "Auth_Flow=1;" +
    "Auth_Client_ID=<service-principal-client-id>;" +
    "Auth_Client_Secret=<service-principal-secret>;" +
    "Auth_Scope=all-apis;";`} />
          </div>
        </div>
      </Section>

      {/* Data Operations */}
      <Section title="Writing & Querying Data Through Databricks" icon={Code2} delay={0.3}>
        <p className="text-white/70 text-sm mb-3">
          With the ODBC connection established, use standard ADO.NET patterns to read/write data.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="text-white/90 font-medium text-sm mb-2">Query Data (SELECT)</h3>
            <CodeBlock language="csharp" code={`using System.Data.Odbc;

using var conn = new OdbcConnection(connectionString);
conn.Open();

using var cmd = new OdbcCommand(
    "SELECT group_name, region, member_count " +
    "FROM arsenal_fan_ops.fan_ops_groups " +
    "ORDER BY member_count DESC", conn);

using var reader = cmd.ExecuteReader();
while (reader.Read())
{
    Console.WriteLine($"{reader["group_name"]} | " +
                      $"{reader["region"]} | " +
                      $"{reader["member_count"]} members");
}`} />
          </div>

          <div>
            <h3 className="text-white/90 font-medium text-sm mb-2">Write Data (INSERT via Lakebase)</h3>
            <CodeBlock language="csharp" code={`// Insert operational data directly into Lakebase tables
using var cmd = new OdbcCommand(
    "INSERT INTO arsenal_fan_ops.fan_ops_operational_notes " +
    "(entity_type, entity_id, fixture_id, note, author, created_at) " +
    "VALUES (?, ?, ?, ?, ?, ?)", conn);

cmd.Parameters.AddWithValue("@entity_type", "fan_group");
cmd.Parameters.AddWithValue("@entity_id", "fg-001");
cmd.Parameters.AddWithValue("@fixture_id", "fix-003");
cmd.Parameters.AddWithValue("@note", "Group confirmed all 45 seats");
cmd.Parameters.AddWithValue("@author", "ops-system");
cmd.Parameters.AddWithValue("@created_at", DateTime.UtcNow.ToString("o"));

int rows = cmd.ExecuteNonQuery();
Console.WriteLine($"Inserted {rows} row(s)");`} />
          </div>

          <div>
            <h3 className="text-white/90 font-medium text-sm mb-2">Bulk Operations with DataTable</h3>
            <CodeBlock language="csharp" code={`// For bulk writes, use parameterized batch inserts
using var transaction = conn.BeginTransaction();
try
{
    foreach (var ticket in ticketBatch)
    {
        using var cmd = new OdbcCommand(
            "INSERT INTO arsenal_fan_ops.ticket_allocations " +
            "(ticket_id, fan_id, fixture_id, status) VALUES (?, ?, ?, ?)", 
            conn, transaction);
        cmd.Parameters.AddWithValue("@tid", ticket.Id);
        cmd.Parameters.AddWithValue("@fid", ticket.FanId);
        cmd.Parameters.AddWithValue("@fix", ticket.FixtureId);
        cmd.Parameters.AddWithValue("@status", "confirmed");
        cmd.ExecuteNonQuery();
    }
    transaction.Commit();
}
catch { transaction.Rollback(); throw; }`} />
          </div>
        </div>
      </Section>

      {/* Lakebase Pattern */}
      <Section title="How Lakebase Fits the Pattern" icon={Database} delay={0.4}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <h4 className="text-blue-400 font-medium text-sm mb-2">Lakebase = Operational Layer</h4>
            <ul className="space-y-1.5 text-white/60 text-xs">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" /> Low-latency reads/writes for app-facing queries</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" /> Full ACID transactions for operational updates</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" /> PostgreSQL-compatible — works with any PG driver</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" /> Managed by Databricks — no infrastructure overhead</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <h4 className="text-orange-400 font-medium text-sm mb-2">Delta Lake = Analytical Layer</h4>
            <ul className="space-y-1.5 text-white/60 text-xs">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" /> Large-scale analytics and ML training</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" /> Time-travel and versioned data</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" /> Batch ETL and streaming pipelines</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" /> Unity Catalog governance</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-white/90 font-medium text-sm mb-2">Connection Strategy</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-arsenal-gold font-medium mb-1">For Operational Workloads (OLTP):</p>
              <p className="text-white/60">Connect .NET → Lakebase directly via <strong className="text-white/80">Npgsql</strong> (PostgreSQL .NET driver)</p>
              <CodeBlock language="csharp" code={`// Direct Lakebase connection via Npgsql
using Npgsql;
var connStr = "Host=<lakebase-host>;" +
              "Port=5432;" +
              "Database=arsenal_ops;" +
              "Username=<sp-client-id>;" +
              "Password=<oauth-token>;";
using var conn = new NpgsqlConnection(connStr);`} />
            </div>
            <div>
              <p className="text-arsenal-gold font-medium mb-1">For Analytical Workloads (OLAP):</p>
              <p className="text-white/60">Connect .NET → Databricks SQL Warehouse via <strong className="text-white/80">ODBC</strong></p>
              <CodeBlock language="csharp" code={`// Databricks SQL Warehouse via ODBC
using System.Data.Odbc;
var connStr = "Driver={Simba Spark ODBC Driver};" +
              "Host=<workspace>.cloud.databricks.com;" +
              "HTTPPath=/sql/1.0/warehouses/<id>;" +
              "SSL=1;AuthMech=11;...";
using var conn = new OdbcConnection(connStr);`} />
            </div>
          </div>
        </div>
      </Section>

      {/* Security */}
      <Section title="Security & Authentication" icon={Lock} delay={0.5}>
        <div className="space-y-3">
          {[
            { title: "OAuth 2.0 M2M (Service Principals)", desc: "Recommended for production. Create a Databricks Service Principal, grant warehouse access, and use client_id/secret for token generation. Tokens auto-rotate.", badge: "Recommended" },
            { title: "Personal Access Tokens (PAT)", desc: "Suitable for development. Generate from Databricks workspace settings. Set expiry and restrict IP ranges.", badge: "Dev Only" },
            { title: "Azure AD / Entra ID (Azure Databricks)", desc: "Use managed identity or Azure AD service principal for seamless SSO integration in Azure-hosted .NET apps.", badge: "Azure" },
            { title: "TLS/SSL Encryption", desc: "All connections use TLS 1.2+ by default. The ODBC driver enforces SSL=1. No plaintext data in transit.", badge: "Always On" },
            { title: "Unity Catalog RBAC", desc: "Fine-grained access control at catalog/schema/table/column level. Service principals inherit only granted permissions.", badge: "Governance" },
            { title: "Network Security", desc: "Use private endpoints, IP access lists, or VNet injection to restrict connectivity from your .NET app to the Databricks workspace.", badge: "Network" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white/90 font-medium text-sm">{item.title}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">{item.badge}</span>
                </div>
                <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Limitations vs S3 */}
      <Section title="Considerations vs. S3 Staging" icon={AlertTriangle} delay={0.6}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-emerald-400 font-medium text-sm mb-2">Advantages of Direct ODBC</h4>
            <ul className="space-y-2 text-white/60 text-xs">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> Simpler architecture — no intermediate storage to manage</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> Real-time reads and writes (no batch delay)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> No S3 costs, IAM roles, or bucket lifecycle policies</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> Reduced attack surface (fewer credentials, no S3 keys)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> Transactional consistency with Lakebase (ACID)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> Lower operational complexity and fewer failure points</li>
            </ul>
          </div>
          <div>
            <h4 className="text-amber-400 font-medium text-sm mb-2">Considerations & Limitations</h4>
            <ul className="space-y-2 text-white/60 text-xs">
              <li className="flex items-start gap-2"><AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" /> Bulk ingestion ({">"}100K rows): Consider Databricks Zerobus or COPY INTO for large batches</li>
              <li className="flex items-start gap-2"><AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" /> ODBC driver throughput is per-connection; pool connections for concurrency</li>
              <li className="flex items-start gap-2"><AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" /> Serverless warehouse has cold-start latency (~5-15s first query)</li>
              <li className="flex items-start gap-2"><AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" /> File-based ingestion (Parquet/CSV to S3) is more efficient for batch ETL &gt;1M rows</li>
              <li className="flex items-start gap-2"><AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" /> Lakebase has connection limits — use connection pooling in .NET</li>
              <li className="flex items-start gap-2"><AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" /> Simba ODBC driver requires platform-specific installation (Windows/Linux)</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Deployment Steps */}
      <Section title="Deployment Steps & Prerequisites" icon={Zap} delay={0.7}>
        <div className="space-y-4">
          {[
            { step: 1, title: "Provision Databricks Resources", items: ["Create or identify a Databricks workspace", "Create a Serverless SQL Warehouse", "Create a Lakebase instance (Compute → Lakebase)", "Create target schema and tables in Lakebase"] },
            { step: 2, title: "Configure Authentication", items: ["Create a Databricks Service Principal", "Grant the SP access to the SQL Warehouse (CAN USE)", "Grant the SP access to the Lakebase database (READ_WRITE)", "Generate or note the client_id and client_secret"] },
            { step: 3, title: "Install ODBC Driver on .NET Host", items: ["Download Simba Spark ODBC Driver (v2.7+)", "Install on Windows (MSI) or Linux (RPM/DEB)", "Configure DSN or use connection string inline", "Verify with `odbcinst -q -d` (Linux) or ODBC Data Source Admin (Windows)"] },
            { step: 4, title: "Configure .NET Application", items: ["Add `System.Data.Odbc` NuGet package", "Add `Npgsql` NuGet package (for direct Lakebase access)", "Store connection strings in Azure Key Vault or env vars", "Implement connection pooling and retry logic"] },
            { step: 5, title: "Network & Security", items: ["Configure private endpoints or IP access lists", "Ensure TLS 1.2+ is enforced", "Set up Unity Catalog permissions (table-level)", "Enable audit logging for compliance"] },
            { step: 6, title: "Test & Validate", items: ["Run connectivity test with simple SELECT query", "Validate write operations to Lakebase tables", "Load test with expected concurrency (connection pooling)", "Monitor warehouse utilization in Databricks SQL UI"] },
          ].map(({ step, title, items }) => (
            <div key={step} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-arsenal-red/20 border border-arsenal-red/30 flex items-center justify-center">
                <span className="text-arsenal-red font-bold text-sm">{step}</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white/90 font-medium text-sm">{title}</h4>
                <ul className="mt-1.5 space-y-1">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-white/50 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-white/30 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-arsenal-gold/5 border border-arsenal-gold/20">
          <h4 className="text-arsenal-gold font-medium text-sm mb-2">NuGet Packages Required</h4>
          <CodeBlock language="xml" code={`<!-- .csproj dependencies -->
<PackageReference Include="System.Data.Odbc" Version="8.0.0" />
<PackageReference Include="Npgsql" Version="8.0.3" />
<PackageReference Include="Microsoft.Extensions.Configuration" Version="8.0.0" />
<PackageReference Include="Polly" Version="8.3.1" />  <!-- Retry policies -->`} />
        </div>
      </Section>

      {/* Summary */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.8 }}
        className="p-6 rounded-2xl border border-arsenal-gold/20 bg-gradient-to-br from-arsenal-gold/5 to-transparent backdrop-blur-xl text-center"
      >
        <h3 className="text-arsenal-gold font-display text-xl tracking-wider uppercase mb-2">Architecture Summary</h3>
        <p className="text-white/60 text-sm max-w-2xl mx-auto">
          By removing the S3 staging layer, the .NET application connects directly to Databricks — using <strong className="text-white">ODBC</strong> for analytical queries
          and <strong className="text-white">Npgsql</strong> for Lakebase operational data. This delivers a simpler, more secure, and lower-latency architecture
          with fewer moving parts and reduced cloud costs.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {["No S3 Dependency", "Direct ODBC", "Lakebase ACID", "OAuth M2M", "Unity Catalog RBAC", "TLS 1.2+"].map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">{tag}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
