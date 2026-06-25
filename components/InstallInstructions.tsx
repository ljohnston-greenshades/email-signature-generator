"use client";

export default function InstallInstructions({ hasReply = true }: { hasReply?: boolean }) {
  return (
    <div className="card install" style={{ marginTop: 24 }}>
      <h2>⚙️ Installing in Outlook</h2>
      <p className="card-sub">Takes about a minute — copy, paste, done.</p>

      <ol>
        <li>
          Open signature settings:
          <br />
          <strong>Windows:</strong> <code>File → Options → Mail → Signatures</code>
          <br />
          <strong>Mac:</strong> <code>Outlook → Settings → Signatures</code>
        </li>
        <li>
          Click <strong>New</strong> (or <strong>+</strong>) and name it{" "}
          <code>Greenshades - Full</code>.
        </li>
        <li>
          Back here, click <strong>Copy full signature</strong>, then paste
          (<code>Ctrl+V</code> / <code>Cmd+V</code>) into the editor. Set it as the default for{" "}
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

      <div className="notice notice-warn" style={{ marginTop: 16 }}>
        <strong>Please don't hand-edit your signature.</strong> Fonts, colors, sizing, and layout
        are standardized for brand consistency. If something looks off or you need a change, contact
        the Marketing team rather than editing manually.
      </div>
    </div>
  );
}
