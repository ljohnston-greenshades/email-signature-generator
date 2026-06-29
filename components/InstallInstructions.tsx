"use client";

export default function InstallInstructions({ hasReply = true }: { hasReply?: boolean }) {
  return (
    <div className="card install">
      <h2>⚙️ Installing in Outlook</h2>
      <p className="card-sub">Takes about a minute — copy, paste, done.</p>

      <ol>
        <li>
          In the preview, click <strong>Copy full signature</strong> — it's now on your clipboard.
        </li>
        <li>
          Open Outlook&apos;s signature settings:
          <br />
          <strong>Windows:</strong> <code>File → Options → Mail → Signatures</code>
          <br />
          <strong>Mac:</strong> <code>Outlook → Settings → Signatures</code>
        </li>
        <li>
          Click <strong>New</strong> (or <strong>+</strong>), name it <code>Greenshades - Full</code>
          , paste (<code>Ctrl+V</code> / <code>Cmd+V</code>), and set it as the default for{" "}
          <strong>New messages</strong>.
        </li>
        {hasReply && (
          <li>
            <em>Optional:</em> for a shorter reply/forward signature, expand{" "}
            <strong>Reply signature</strong> above, click <strong>Copy reply signature</strong>, add
            it as a second signature named <code>Greenshades - Reply</code>, and set it as the
            default for <strong>Replies/forwards</strong>.
          </li>
        )}
        <li>Send yourself a test email to confirm it looks correct.</li>
      </ol>

      <hr className="divider" />

      <h3 style={{ fontSize: 16, color: "var(--navy)", margin: "0 0 4px" }}>
        Using HubSpot instead?
      </h3>
      <p className="card-sub">
        HubSpot&apos;s signature editor strips a normal paste, so paste the HTML directly.
      </p>
      <ol>
        <li>
          In the preview, click <strong>Copy HTML</strong>.
        </li>
        <li>
          Open HubSpot&apos;s <strong>Manage email signatures</strong> editor.
        </li>
        <li>
          Above the signature box, switch the <strong>Simple / HTML</strong> toggle to{" "}
          <strong>HTML</strong>.
        </li>
        <li>
          Select everything in the box, paste (<code>Ctrl+V</code> / <code>Cmd+V</code>), and click{" "}
          <strong>Save</strong>.
        </li>
      </ol>

      <div className="notice notice-warn" style={{ marginTop: 16 }}>
        <strong>Please don't hand-edit your signature.</strong> Fonts, colors, sizing, and layout
        are standardized for brand consistency. If something looks off or you need a change, contact
        the Marketing team rather than editing manually.
      </div>
    </div>
  );
}
